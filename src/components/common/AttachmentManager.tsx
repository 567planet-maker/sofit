'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  uploadAttachment,
  removeAttachment,
  updateAttachmentNote,
  type AttachmentRow,
} from '@/app/actions/quote-request'

function bucketFor(kind: string) {
  return kind === 'drawing' || kind === 'prev_quote' ? 'request-documents' : 'request-images'
}

export type Item = AttachmentRow & { url?: string; uploading?: boolean; error?: string }

type Props = {
  requestId: string
  /** site_photo | drawing 등 — 버킷·용도 결정 */
  kind: string
  accept: string
  maxSizeMb: number
  label: string
  hint?: string
  /** true면 썸네일(이미지), false면 파일 칩(문서) */
  isImage: boolean
  /** 서버에서 signed url을 미리 넣어줄 수 있음(url). 없으면 클라이언트가 폴백 발급. */
  initial: Item[]
  /** 분야별 첨부면 해당 item(분야) id, 전체 첨부면 null/미지정 */
  itemId?: string | null
  /** items가 바뀔 때마다 상위에 알림 (우측 요약 실시간 반영용) */
  onChange?: (items: Item[]) => void
}

export default function AttachmentManager({
  requestId,
  kind,
  accept,
  maxSizeMb,
  label,
  hint,
  isImage,
  initial,
  itemId = null,
  onChange,
}: Props) {
  const bucket = bucketFor(kind)
  const [items, setItems] = useState<Item[]>(initial)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // onChange를 ref로 참조해 items 변경 시에만 통지(콜백 정체성과 무관하게 루프 방지)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })
  useEffect(() => {
    onChangeRef.current?.(items)
  }, [items])

  // 이미지 썸네일 URL 폴백 — 서버가 url을 안 넣어준 초기 항목만 클라이언트에서 발급. 마운트 1회만.
  const signedRef = useRef(false)
  useEffect(() => {
    if (signedRef.current) return
    signedRef.current = true
    if (!isImage) return
    const missing = initial.filter((a) => !a.url)
    if (missing.length === 0) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const urls = new Map<string, string>()
      await Promise.all(
        missing.map(async (a) => {
          const { data } = await supabase.storage
            .from(bucketFor(a.kind))
            .createSignedUrl(a.storage_path, 3600)
          if (data?.signedUrl) urls.set(a.id, data.signedUrl)
        }),
      )
      if (!cancelled && urls.size > 0) {
        setItems((prev) => prev.map((it) => (urls.has(it.id) ? { ...it, url: urls.get(it.id) } : it)))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isImage, initial])

  async function addFiles(files: File[]) {
    setError(null)
    const maxBytes = maxSizeMb * 1024 * 1024
    const accepted = accept.split(',').map((t) => t.trim().toLowerCase())
    const valid = files.filter((f) => {
      if (f.size > maxBytes) return false
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`
      return accepted.includes(ext) || accepted.includes(f.type)
    })
    if (valid.length === 0) {
      setError(`업로드 가능한 파일이 없습니다. (${accept}, 최대 ${maxSizeMb}MB)`)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    for (const file of valid) {
      const tempId = crypto.randomUUID()
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/${requestId}/${tempId}.${ext}`
      const objectUrl = isImage && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined

      setItems((prev) => [
        ...prev,
        {
          id: tempId,
          item_id: itemId,
          kind,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          note: null,
          url: objectUrl,
          uploading: true,
        },
      ])

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file)
      if (upErr) {
        setItems((prev) =>
          prev.map((it) => (it.id === tempId ? { ...it, uploading: false, error: '업로드 실패' } : it)),
        )
        continue
      }

      const res = await uploadAttachment(requestId, {
        kind,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        itemId,
      })
      if ('error' in res) {
        await supabase.storage.from(bucket).remove([path])
        setItems((prev) => prev.map((it) => (it.id === tempId ? { ...it, uploading: false, error: res.error } : it)))
        continue
      }
      // temp id → 실제 DB id 로 교체 (썸네일 url 유지)
      setItems((prev) =>
        prev.map((it) => (it.id === tempId ? { ...res.attachment, url: objectUrl } : it)),
      )
    }
  }

  async function remove(id: string) {
    const target = items.find((it) => it.id === id)
    if (target?.url && target.url.startsWith('blob:')) URL.revokeObjectURL(target.url)
    setItems((prev) => prev.filter((it) => it.id !== id))
    const res = await removeAttachment(requestId, id)
    if ('error' in res) setError(res.error)
  }

  // 파일 설명(note) — 입력 즉시 로컬 반영, 800ms 디바운스로 서버 저장
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  function changeNote(id: string, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, note: value } : it)))
    if (noteTimers.current[id]) clearTimeout(noteTimers.current[id])
    noteTimers.current[id] = setTimeout(() => {
      void updateAttachmentNote(requestId, id, value)
    }, 800)
  }
  useEffect(() => {
    const timers = noteTimers.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  const fileExt = (name: string | null) => name?.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <div className="space-y-3">
      <div
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-5 py-6 text-center transition-colors ${
          isDragging ? 'border-brand bg-brand-tint' : 'border-border hover:border-brand-tint-strong hover:bg-surface-muted'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            if (e.target.files) {
              addFiles(Array.from(e.target.files))
              e.target.value = ''
            }
          }}
          className="hidden"
        />
        {/* 이모지 대신 brand(#0064FF) 단색 라인 아이콘 */}
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand">
          {isImage ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
              <circle cx="8.5" cy="10" r="1.6" />
              <path d="M20.5 15.5 16 11 5 20.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
              <path d="M13.5 3v5.5H19" />
            </svg>
          )}
        </span>
        <p className="mt-2.5 text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-ink-subtle">
          {hint ? `${hint} · 최대 ${maxSizeMb}MB` : `최대 ${maxSizeMb}MB`}
        </p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {items.length > 0 &&
        (isImage ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="flex flex-col gap-1.5">
                <div className="group relative aspect-square overflow-hidden rounded-card border border-border bg-surface-muted">
                  {it.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt={it.file_name ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-ink-subtle">
                      {it.uploading ? '업로드 중…' : it.error ?? '미리보기 없음'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(it.id)
                    }}
                    aria-label="첨부 삭제"
                    className="absolute right-1 top-1 rounded-full bg-black/50 px-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
                <NoteInput
                  value={it.note ?? ''}
                  disabled={!!it.uploading || !!it.error}
                  onChange={(v) => changeNote(it.id, v)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="rounded-lg border border-border bg-surface-muted p-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-border text-[10px] font-semibold text-ink-muted">
                    {fileExt(it.file_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.file_name}</p>
                    {it.uploading && <p className="text-xs text-brand">업로드 중…</p>}
                    {it.error && <p className="text-xs text-danger">{it.error}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(it.id)
                    }}
                    aria-label="첨부 삭제"
                    className="flex-shrink-0 rounded p-1 text-ink-subtle hover:bg-border hover:text-ink-muted"
                  >
                    ✕
                  </button>
                </div>
                <NoteInput
                  className="mt-2"
                  value={it.note ?? ''}
                  disabled={!!it.uploading || !!it.error}
                  onChange={(v) => changeNote(it.id, v)}
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}

// 파일 설명 입력 — 한 줄로 시작해 내용이 넘치면 다음 줄로 늘어나는 자동 높이 textarea
function NoteInput({
  value,
  onChange,
  disabled,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      disabled={disabled}
      maxLength={200}
      onChange={(e) => onChange(e.target.value)}
      placeholder="설명 추가 (선택)"
      className={`w-full resize-none overflow-hidden rounded-md border border-border bg-white px-2 py-1 text-xs leading-[1.5] text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand disabled:bg-surface-muted disabled:text-ink-subtle ${className}`}
    />
  )
}
