'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMatch, cancelMatch, createCustomerFactoryChat } from '@/app/actions/admin'
import { CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'

type FactoryWithMeta = {
  id: string
  company_name: string
  location: string | null
  description: string | null
  rating_avg: number
  categories: string[]
  matchStatus: string | null
}

type RequestCategory = { key: string; label: string }

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

function catLabel(key: string) {
  return CATEGORY_LABELS[key as CategoryKey] ?? key
}

export default function MatchClient({
  requestId,
  requestCategories,
  factories,
  existingMatches,
}: {
  requestId: string
  requestCategories: RequestCategory[]
  factories: FactoryWithMeta[]
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
      if (result.error) setError(result.error)
      else router.refresh()
      setActionId(null)
    })
  }

  const handleCancel = (matchId: string) => {
    if (!confirm('이 매칭을 취소하시겠습니까?')) return
    setError(null)
    setActionId(matchId)
    startTransition(async () => {
      const result = await cancelMatch(matchId)
      if (result.error) setError(result.error)
      else router.refresh()
      setActionId(null)
    })
  }

  const handleCreateChat = (matchId: string) => {
    setError(null)
    setActionId(matchId + '_chat')
    startTransition(async () => {
      const result = await createCustomerFactoryChat(requestId, matchId)
      if (result.error) setError(result.error)
      else router.refresh()
      setActionId(null)
    })
  }

  const activeMatches = existingMatches.filter((m) => m.status !== 'cancelled')

  // 분야별 배정 그룹: 요청 분야마다 그 분야를 시공하는 활성 공장
  const groups = requestCategories.map((cat) => ({
    cat,
    factories: factories.filter((f) => f.categories.includes(cat.key)),
  }))
  // 요청 분야 외 / 분야 미지정 공장 (관리자가 수동 배정 가능하도록 별도 노출)
  const reqKeys = new Set(requestCategories.map((c) => c.key))
  const otherFactories = factories.filter(
    (f) => f.categories.length === 0 || !f.categories.some((c) => reqKeys.has(c)),
  )

  const FactoryCard = ({ f }: { f: FactoryWithMeta }) => {
    const isLoading = actionId === f.id
    const statusInfo = f.matchStatus ? MATCH_STATUS[f.matchStatus] ?? MATCH_STATUS.pending : null
    return (
      <div className="flex items-start justify-between rounded-card border border-border bg-white p-4 shadow-card">
        <div className="min-w-0">
          <p className="font-medium text-ink">{f.company_name}</p>
          {f.location && <p className="mt-0.5 text-xs text-ink-muted">{f.location}</p>}
          {f.categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {f.categories.map((c) => (
                <span
                  key={c}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    reqKeys.has(c)
                      ? 'bg-brand-tint text-brand'
                      : 'bg-surface-muted text-ink-subtle'
                  }`}
                >
                  {catLabel(c)}
                </span>
              ))}
            </div>
          )}
          {f.rating_avg > 0 && (
            <p className="mt-1 text-xs text-warning">★ {f.rating_avg.toFixed(1)}</p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          {statusInfo ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          ) : (
            <button
              onClick={() => handleDispatch(f.id)}
              disabled={isLoading || isPending}
              className="rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-40"
            >
              {isLoading ? '배포 중...' : '배포'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-lg bg-danger-tint px-4 py-2 text-sm text-danger">{error}</p>}

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

      {/* 분야별 배정 */}
      <section>
        <h2 className="mb-1 font-medium text-ink">분야별 공장 배정</h2>
        <p className="mb-4 text-xs text-ink-subtle">
          한 번 배포하면 그 공장은 자신의 전문 분야 견적을 작성할 수 있습니다(요청 단위 배포).
        </p>

        {requestCategories.length === 0 ? (
          <p className="rounded-card border border-dashed border-border py-8 text-center text-sm text-ink-subtle">
            이 요청에는 분야 정보가 없습니다(레거시 요청). 아래 전체 활성 공장에서 배포하세요.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map(({ cat, factories: catFactories }) => (
              <div key={cat.key}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{cat.label}</h3>
                  <span className="text-xs text-ink-subtle">시공 가능 {catFactories.length}곳</span>
                </div>
                {catFactories.length === 0 ? (
                  <p className="rounded-card border border-dashed border-border px-4 py-4 text-center text-xs text-ink-subtle">
                    이 분야를 시공하는 활성 공장이 없습니다.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catFactories.map((f) => (
                      <FactoryCard key={f.id} f={f} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 요청 분야 외 / 분야 미지정 공장 */}
      {otherFactories.length > 0 && (
        <section>
          <h2 className="mb-1 font-medium text-ink">기타 활성 공장</h2>
          <p className="mb-3 text-xs text-ink-subtle">
            요청 분야와 무관하거나 전문 분야가 등록되지 않은 공장 — 필요 시 수동 배포.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherFactories.map((f) => (
              <FactoryCard key={f.id} f={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
