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
  pending: { label: '검토중', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: '수락', className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '거절', className: 'bg-red-50 text-red-600 border-red-200' },
  cancelled: { label: '취소', className: 'bg-gray-100 text-gray-500 border-gray-200' },
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
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* 배포된 공장 현황 */}
      {activeMatches.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">배포된 공장 현황</h2>
          <div className="space-y-3">
            {activeMatches.map((m) => {
              const statusInfo = MATCH_STATUS[m.status] ?? MATCH_STATUS.pending
              const quote = m.factory_quotes?.[0]
              const isLoading = actionId === m.id || actionId === m.id + '_chat'
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{m.factories?.company_name}</p>
                    {m.factories?.location && (
                      <p className="text-xs text-gray-500">{m.factories.location}</p>
                    )}
                    {m.status === 'rejected' && m.note && (
                      <p className="mt-1 text-xs text-gray-400">거절 사유: {m.note}</p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    {quote && quote.status === 'submitted' && (
                      <span className="text-sm font-semibold text-indigo-700">
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
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                      >
                        {isLoading ? '...' : '채팅방 생성'}
                      </button>
                    )}
                    {m.chatRoomId && (
                      <a
                        href={`/admin/chats/${m.chatRoomId}`}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                      >
                        채팅 보기
                      </a>
                    )}
                    {m.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(m.id)}
                        disabled={isLoading || isPending}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
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
        <h2 className="mb-3 font-semibold text-gray-800">활성 공장 목록</h2>
        {availableFactories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            배포 가능한 활성 공장이 없습니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableFactories.map((f) => {
              const isLoading = actionId === f.id
              return (
                <div
                  key={f.id}
                  className="flex items-start justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{f.company_name}</p>
                    {f.location && (
                      <p className="mt-0.5 text-xs text-gray-500">{f.location}</p>
                    )}
                    {f.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{f.description}</p>
                    )}
                    {f.rating_avg > 0 && (
                      <p className="mt-1 text-xs text-yellow-600">★ {f.rating_avg.toFixed(1)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDispatch(f.id)}
                    disabled={isLoading || isPending}
                    className="ml-3 flex-shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
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
