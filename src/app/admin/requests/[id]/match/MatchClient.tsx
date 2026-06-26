'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMatch, cancelMatch, createCustomerFactoryChat } from '@/app/actions/admin'

type AvailableFactory = {
  id: string
  company_name: string
  location: string | null
  description: string | null
  rating_avg: number
}

type ExistingMatch = {
  id: string
  status: string
  note: string | null
  created_at: string
  factories: { id: string; company_name: string; location: string | null } | null
  factory_quotes: { total_cost: number; delivery_days: number | null; status: string }[]
  chatRoomId?: string | null
}

const MATCH_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: '검토중', className: 'bg-warning-tint text-warning border-yellow-200' },
  confirmed: { label: '수락', className: 'bg-success-tint text-success border-green-200' },
  rejected: { label: '거절', className: 'bg-danger-tint text-danger border-danger/30' },
  cancelled: { label: '취소', className: 'bg-surface-muted text-ink-muted border-border' },
}

export default function MatchClient({
  requestId,
  availableFactories,
  existingMatches,
}: {
  requestId: string
  availableFactories: AvailableFactory[]
  existingMatches: ExistingMatch[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDispatch = (factoryId: string) => {
    setError(null)
    setActionId(factoryId)
    startTransition(async () => {
      const result = await createMatch(requestId, factoryId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
      setActionId(null)
    })
  }

  const handleCancel = (matchId: string) => {
    if (!confirm('이 매칭을 취소하시겠습니까?')) return
    setError(null)
    setActionId(matchId)
    startTransition(async () => {
      const result = await cancelMatch(matchId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
      setActionId(null)
    })
  }

  const handleCreateChat = (matchId: string) => {
    setError(null)
    setActionId(matchId + '_chat')
    startTransition(async () => {
      const result = await createCustomerFactoryChat(requestId, matchId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
      setActionId(null)
    })
  }

  const activeMatches = existingMatches.filter((m) => m.status !== 'cancelled')

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-danger-tint px-4 py-2 text-sm text-danger">{error}</p>
      )}

      {/* 배포된 공장 현황 */}
      {activeMatches.length > 0 && (
        <section>
          <h2 className="mb-3 font-medium text-ink">배포된 공장 현황</h2>
          <div className="space-y-3">
            {activeMatches.map((m) => {
              const statusInfo = MATCH_STATUS[m.status] ?? MATCH_STATUS.pending
              const quote = m.factory_quotes?.[0]
              const isLoading = actionId === m.id || actionId === m.id + '_chat'
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-card border border-border bg-white p-4 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{m.factories?.company_name}</p>
                    {m.factories?.location && (
                      <p className="text-xs text-ink-muted">{m.factories.location}</p>
                    )}
                    {m.status === 'rejected' && m.note && (
                      <p className="mt-1 text-xs text-ink-subtle">거절 사유: {m.note}</p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    {quote && quote.status === 'submitted' && (
                      <span className="text-sm font-medium text-brand">
                        {new Intl.NumberFormat('ko-KR').format(quote.total_cost)}원
                        {quote.delivery_days ? ` · ${quote.delivery_days}일` : ''}
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                    {m.status === 'confirmed' && !m.chatRoomId && (
                      <button
                        onClick={() => handleCreateChat(m.id)}
                        disabled={isLoading || isPending}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-40"
                      >
                        {isLoading ? '...' : '채팅방 생성'}
                      </button>
                    )}
                    {m.chatRoomId && (
                      <a
                        href={`/admin/chats/${m.chatRoomId}`}
                        className="rounded-lg border border-brand-tint-strong px-3 py-1.5 text-xs text-brand hover:bg-brand-tint"
                      >
                        채팅 보기
                      </a>
                    )}
                    {m.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(m.id)}
                        disabled={isLoading || isPending}
                        className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger-tint disabled:opacity-40"
                      >
                        {isLoading ? '...' : '배포 취소'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 배포 가능한 공장 */}
      <section>
        <h2 className="mb-3 font-medium text-ink">활성 공장 목록</h2>
        {availableFactories.length === 0 ? (
          <p className="rounded-card border border-dashed border-border py-10 text-center text-sm text-ink-subtle">
            배포 가능한 활성 공장이 없습니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableFactories.map((f) => {
              const isLoading = actionId === f.id
              return (
                <div
                  key={f.id}
                  className="flex items-start justify-between rounded-card border border-border bg-white p-4 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{f.company_name}</p>
                    {f.location && (
                      <p className="mt-0.5 text-xs text-ink-muted">{f.location}</p>
                    )}
                    {f.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-subtle">{f.description}</p>
                    )}
                    {f.rating_avg > 0 && (
                      <p className="mt-1 text-xs text-warning">★ {f.rating_avg.toFixed(1)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDispatch(f.id)}
                    disabled={isLoading || isPending}
                    className="ml-3 flex-shrink-0 rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-40"
                  >
                    {isLoading ? '배포 중...' : '배포'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
