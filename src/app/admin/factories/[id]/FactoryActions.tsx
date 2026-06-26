'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveFactory, rejectFactory, suspendFactory, activateFactory } from '@/app/actions/admin'
import type { FactoryStatus } from '@/types'

export default function FactoryActions({
  factoryId,
  currentStatus,
}: {
  factoryId: string
  currentStatus: FactoryStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleApprove = () => {
    if (!confirm('이 공장을 승인하시겠습니까?')) return
    run(() => approveFactory(factoryId))
  }

  const handleReject = () => {
    run(() => rejectFactory(factoryId, rejectNote || undefined))
  }

  const handleSuspend = () => {
    if (!confirm('이 공장을 정지하시겠습니까?')) return
    run(() => suspendFactory(factoryId))
  }

  const handleActivate = () => {
    if (!confirm('이 공장을 다시 활성화하시겠습니까?')) return
    run(() => activateFactory(factoryId))
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-danger-tint px-4 py-2 text-sm text-danger">{error}</p>
      )}

      {/* pending 상태: 승인 / 반려 */}
      {currentStatus === 'pending' && (
        <>
          {!showRejectForm ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 rounded-card bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                {isPending ? '처리 중...' : '승인'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex-1 rounded-card border border-danger/30 py-3 text-sm font-medium text-danger hover:bg-danger-tint disabled:opacity-40"
              >
                반려
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-card border border-border bg-surface-muted p-4">
              <p className="text-sm font-medium text-ink">반려 사유 (선택)</p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="반려 사유를 입력하면 공장에게 전달됩니다."
                rows={3}
                className="w-full resize-none rounded-card border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="flex-1 rounded-card bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40"
                >
                  {isPending ? '처리 중...' : '반려 확인'}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={isPending}
                  className="flex-1 rounded-card border border-border bg-white py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-muted"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* active 상태: 정지 */}
      {currentStatus === 'active' && (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="w-full rounded-card border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-muted disabled:opacity-40"
        >
          {isPending ? '처리 중...' : '파트너 정지'}
        </button>
      )}

      {/* suspended 또는 rejected 상태: 재활성화 */}
      {(currentStatus === 'suspended' || currentStatus === 'rejected') && (
        <button
          onClick={handleActivate}
          disabled={isPending}
          className="w-full rounded-card bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
        >
          {isPending ? '처리 중...' : '재활성화'}
        </button>
      )}
    </div>
  )
}
