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
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">상태 변경</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as QuoteRequestStatus)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">메모 (선택)</label>
          <input
            type="text"
            placeholder="상태 변경 이유..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <button
          onClick={handleChange}
          disabled={isPending || selected === currentStatus}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {isPending ? '처리중...' : '변경'}
        </button>
      </div>
    </div>
  )
}
