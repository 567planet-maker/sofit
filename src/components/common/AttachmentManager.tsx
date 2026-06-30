'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAttachment, removeAttachment, type AttachmentRow } from '@/app/actions/quote-request'

function bucketFor(kind: string) {
  return kind === 'drawing' || kind === 'prev_quote' ? 'request-documents' : 'request-images'
}

type Item = AttachmentRow & { url?: string; uploading?: boolean; error?: string }

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
  initial: AttachmentRow[]
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
}: Props) {
  const bucket = bucketFor(kind)
  const [items, setItems] = useState<Item[]>(initial)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 기존 첨부 서명 URL (이미지 썸네일용) — 마운트 1회만
  const signedRef = useRef(false)
  useEffect(() => {
    if (signedRef.current) return
    signedRef.current = true
    if (!isImage || initial.length === 0) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const withUrls = await Promise.all(
        initial.map(async (a) => {
          const { data } = await supabase.storage
            .from(bucketFor(a.kind))
            .createSignedUrl(a.storage_path, 3600)
          return { ...a, url: data?.signedUrl ?? undefined }
        }),
      )
      if (!cancelled) setItems(withUrls)
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
        { id: tempId, kind, storage_path: path, file_name: file.name, mime_type: file.type, url: objectUrl, uploading: true },
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
      })
      if ('error' in res) {
        await supabase.storage.from(bucket).remove([path])
        setItems((prev) => prev.map((it) => (it.id === tempId ? { ...it, uploading: false, error: res.error } : it)))
        continue
      }
      // temp id → 실제 DB id 로 교체
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
        className={`cursor-pointer rounded-card border-2 border-dashed p-5 text-center transition-colors ${
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
        <p className="text-xl">{isImage ? '🖼️' : '📎'}</p>
        <p className="mt-1 text-sm font-medium text-ink-muted">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
        <p className="mt-0.5 text-xs text-ink-subtle">최대 {maxSizeMb}MB</p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {items.length > 0 && (
        <div className={isImage ? 'grid grid-cols-3 gap-2 sm:grid-cols-4' : 'space-y-2'}>
          {items.map((it) => (
            <div
              key={it.id}
              className={
                isImage
                  ? 'group relative aspect-square overflow-hidden rounded-card border border-border bg-surface-muted'
                  : 'flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-2.5'
              }
            >
              {isImage ? (
                it.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.file_name ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-ink-subtle">
                    {it.uploading ? '업로드 중…' : it.error ?? '미리보기 없음'}
                  </div>
                )
              ) : (
                <>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-border text-[10px] font-semibold text-ink-muted">
                    {fileExt(it.file_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.file_name}</p>
                    {it.uploading && <p className="text-xs text-brand">업로드 중…</p>}
                    {it.error && <p className="text-xs text-danger">{it.error}</p>}
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(it.id)
                }}
                aria-label="첨부 삭제"
                className={
                  isImage
                    ? 'absolute right-1 top-1 rounded-full bg-black/50 px-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'
                    : 'flex-shrink-0 rounded p-1 text-ink-subtle hover:bg-border hover:text-ink-muted'
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
