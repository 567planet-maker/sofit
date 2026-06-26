'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { changeRequestStatus } from '@/app/actions/admin'
import type { QuoteRequestStatus } from '@/types'
import { QUOTE_REQUEST_STATUS_LABELS } from '@/lib/constants/status'

const ALL_STATUSES = (
  Object.entries(QUOTE_REQUEST_STATUS_LABELS) as [QuoteRequestStatus, string][]
).map(([value, label]) => ({ value, label }))

export default function StatusChanger({
  requestId,
  currentStatus,
}: {
  requestId: string
  currentStatus: QuoteRequestStatus
}) {
  const [selected, setSelected] = useState<QuoteRequestStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = () => {
    if (selected === currentStatus) return
    setError(null)
    startTransition(async () => {
      const result = await changeRequestStatus(requestId, selected, note || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setNote('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">상태 변경</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as QuoteRequestStatus)}
          className="w-full rounded-control border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">메모 (선택)</label>
        <input
          type="text"
          placeholder="상태 변경 이유..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-control border border-border px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      <button
        onClick={handleChange}
        disabled={isPending || selected === currentStatus}
        className="w-full rounded-control bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-40"
      >
        {isPending ? '처리중...' : '변경'}
      </button>
    </div>
  )
}
