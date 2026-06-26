'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UploadedFile = {
  bucket: string
  path: string
  fileName: string
  fileSize: number
  fileType: 'image' | 'document' | 'sample'
}

type FileItem = {
  id: string
  file: File
  previewUrl: string
  uploadedPath?: string
  isUploading: boolean
  error?: string
}

type Props = {
  bucket: string
  fileType: 'image' | 'document' | 'sample'
  accept: string
  maxSizeMb: number
  label: string
  hint?: string
  onChange: (files: UploadedFile[]) => void
  disabled?: boolean
}

export default function FileUploader({
  bucket,
  fileType,
  accept,
  maxSizeMb,
  label,
  hint,
  onChange,
  disabled = false,
}: Props) {
  const [items, setItems] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const notifyParent = useCallback(
    (updated: FileItem[]) => {
      const uploadedFiles: UploadedFile[] = updated
        .filter((f) => f.uploadedPath)
        .map((f) => ({
          bucket,
          path: f.uploadedPath!,
          fileName: f.file.name,
          fileSize: f.file.size,
          fileType,
        }))
      onChange(uploadedFiles)
    },
    [bucket, fileType, onChange],
  )

  const uploadOne = useCallback(
    async (item: FileItem) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setItems((prev) => {
          const next = prev.map((f) =>
            f.id === item.id
              ? { ...f, isUploading: false, error: '로그인이 필요합니다.' }
              : f,
          )
          notifyParent(next)
          return next
        })
        return
      }

      const ext = item.file.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/${item.id}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(path, item.file)

      setItems((prev) => {
        const next = prev.map((f) =>
          f.id === item.id
            ? error
              ? { ...f, isUploading: false, error: '업로드 실패. 다시 시도해 주세요.' }
              : { ...f, isUploading: false, uploadedPath: path }
            : f,
        )
        notifyParent(next)
        return next
      })
    },
    [bucket, notifyParent],
  )

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const maxBytes = maxSizeMb * 1024 * 1024
      const acceptedExts = accept
        .split(',')
        .map((t) => t.trim().toLowerCase())

      const valid = newFiles.filter((file) => {
        if (file.size > maxBytes) return false
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
        return acceptedExts.includes(ext) || acceptedExts.includes(file.type)
      })

      if (valid.length === 0) return

      const newItems: FileItem[] = valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        isUploading: true,
      }))

      setItems((prev) => [...prev, ...newItems])

      for (const item of newItems) {
        await uploadOne(item)
      }
    },
    [maxSizeMb, accept, uploadOne],
  )

  const removeFile = useCallback(
    async (id: string) => {
      const target = items.find((f) => f.id === id)
      if (!target) return

      if (target.uploadedPath) {
        const supabase = createClient()
        await supabase.storage.from(bucket).remove([target.uploadedPath])
      }
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl)

      setItems((prev) => {
        const next = prev.filter((f) => f.id !== id)
        notifyParent(next)
        return next
      })
    },
    [items, bucket, notifyParent],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (!disabled) addFiles(Array.from(e.dataTransfer.files))
    },
    [disabled, addFiles],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files))
        e.target.value = ''
      }
    },
    [addFiles],
  )

  const ext = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-card border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-brand bg-brand-tint'
            : disabled
              ? 'cursor-not-allowed border-border bg-surface-muted'
              : 'border-border hover:border-brand-tint-strong hover:bg-surface-muted'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-2xl">📎</p>
        <p className="mt-1 text-sm font-medium text-ink-muted">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
        <p className="mt-0.5 text-xs text-ink-subtle">최대 {maxSizeMb}MB</p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-2.5"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-10 w-10 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-border text-xs font-semibold text-ink-muted">
                  {ext(item.file.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
                <p className="text-xs text-ink-subtle">
                  {(item.file.size / 1024 / 1024).toFixed(1)}MB
                </p>
                {item.error && <p className="text-xs text-red-500">{item.error}</p>}
              </div>

              {item.isUploading && (
                <span className="flex-shrink-0 text-xs text-brand">업로드 중…</span>
              )}
              {!item.isUploading && item.uploadedPath && (
                <span className="flex-shrink-0 text-xs text-success">✓ 완료</span>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(item.id)
                }}
                className="flex-shrink-0 rounded p-1 text-ink-subtle hover:bg-border hover:text-ink-muted"
                aria-label="파일 삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
