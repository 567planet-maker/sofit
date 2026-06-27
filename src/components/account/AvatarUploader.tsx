'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateAvatar } from '@/app/actions/profile'
import Avatar from '@/components/ui/Avatar'

export default function AvatarUploader({
  userId,
  name,
  initialUrl,
}: {
  userId: string
  name: string | null
  initialUrl: string | null
}) {
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('jpg, png, webp 형식만 가능합니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setBusy(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
    })
    if (upErr) {
      setError(`업로드 실패: ${upErr.message}`)
      setBusy(false)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    startTransition(async () => {
      const res = await updateAvatar(publicUrl)
      if (res.error) setError(res.error)
      else {
        setUrl(publicUrl)
        router.refresh()
      }
      setBusy(false)
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const res = await updateAvatar(null)
      if (res.error) setError(res.error)
      else {
        setUrl(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={url} name={name} size="xl" />
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy || isPending}
            className="rounded-control border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted disabled:opacity-40"
          >
            {busy || isPending ? '업로드 중...' : '사진 변경'}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy || isPending}
              className="rounded-control border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-40"
            >
              삭제
            </button>
          )}
        </div>
        <p className="text-xs text-ink-subtle">jpg·png·webp, 5MB 이하. 미등록 시 이름 첫 글자로 표시됩니다.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  )
}
