'use client'

import { useState, useTransition } from 'react'
import { updateAdminNote } from '@/app/actions/admin'

export default function AdminNoteEditor({
  requestId,
  initialNote,
}: {
  requestId: string
  initialNote: string | null
}) {
  const [note, setNote] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateAdminNote(requestId, note)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="관리자 내부 메모 (고객·공장에게 노출되지 않음)"
        rows={4}
        className="w-full resize-none rounded-card border border-border px-4 py-3 text-sm outline-none focus:border-brand"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-40"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
        {saved && <span className="text-sm text-success">저장되었습니다.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  )
}
