'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptMatch, rejectMatch } from '@/app/actions/factory'

type Props = {
  matchId: string
  matchStatus: string
}

export default function MatchActions({ matchId, matchStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (matchStatus !== 'pending') {
    const labels: Record<string, { label: string; className: string }> = {
      confirmed: { label: '수락 완료', className: 'bg-green-50 text-green-700 border-green-200' },
      rejected: { label: '거절됨', className: 'bg-gray-100 text-gray-500 border-gray-200' },
      cancelled: { label: '취소됨', className: 'bg-gray-100 text-gray-500 border-gray-200' },
    }
    const info = labels[matchStatus]
    if (info) {
      return (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${info.className}`}>
          {info.label}
        </div>
      )
    }
    return null
  }

  const handleAccept = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await acceptMatch(matchId)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleReject = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await rejectMatch(matchId, rejectNote || undefined)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setShowRejectForm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorMsg}</p>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-opacity hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? '처리 중...' : '수락하기'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            거절하기
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">거절 사유 (선택)</p>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="거절 사유를 입력하면 관리자에게 전달됩니다"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={isPending}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isPending ? '처리 중...' : '거절 확인'}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              disabled={isPending}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
