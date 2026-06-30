import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteVersionCard, { type QuoteVersion, type FactoryInfo } from './QuoteVersionCard'
import { EmptyState } from '@/components/ui'
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type CategoryKey,
} from '@/app/customer/request/schema/categories'

type QuoteRow = QuoteVersion & {
  item_id: string
  matches: {
    id: string
    status: string
    factories: FactoryInfo
  }
}

type FactoryGroup = {
  matchId: string
  factory: FactoryInfo
  quotes: QuoteVersion[]
}

export default async function CustomerQuotesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: requestId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) notFound()

  // 소유권 확인
  const { data: request } = await supabase
    .from('quote_requests')
    .select('id, site_name, status')
    .eq('id', requestId)
    .eq('customer_id', customer.id)
    .single()
  if (!request) notFound()

  // 요청 분야(item) — 라벨·정렬·계약여부
  const { data: itemsData } = await supabase
    .from('quote_request_items')
    .select('id, category, status')
    .eq('request_id', requestId)
  const items = (itemsData ?? []) as Array<{ id: string; category: string; status: string }>

  // submitted + superseded + accepted 견적 — version 내림차순 (rejected=낙찰 탈락은 숨김)
  const { data: allQuotes } = await supabase
    .from('factory_quotes')
    .select(
      `
      id, item_id, version, is_latest,
      material_cost, labor_cost, delivery_cost,
      install_cost, demolition_cost, extra_cost, margin,
      total_cost, delivery_days, scope, note, status, created_at,
      matches!inner(
        id, status, request_id,
        factories!inner(id, company_name, location, rating_avg)
      )
    `,
    )
    .eq('matches.request_id', requestId)
    .in('status', ['submitted', 'superseded', 'accepted'])
    .order('version', { ascending: false })

  const typedQuotes = (allQuotes ?? []) as unknown as QuoteRow[]

  // item_id → (matchId → FactoryGroup), version 내림차순 유지
  const byItem = new Map<string, Map<string, FactoryGroup>>()
  for (const quote of typedQuotes) {
    const itemId = quote.item_id
    const matchId = quote.matches.id
    if (!byItem.has(itemId)) byItem.set(itemId, new Map())
    const factoryMap = byItem.get(itemId)!
    if (!factoryMap.has(matchId)) {
      factoryMap.set(matchId, { matchId, factory: quote.matches.factories, quotes: [] })
    }
    factoryMap.get(matchId)!.quotes.push(quote as unknown as QuoteVersion)
  }

  // 분야 정렬 순서 (공정 흐름) 인덱스
  const order = new Map(ALL_CATEGORIES.map((c, i) => [c.key, i]))
  const sortedItems = [...items].sort(
    (a, b) => (order.get(a.category as CategoryKey) ?? 99) - (order.get(b.category as CategoryKey) ?? 99),
  )

  // 수락 가능: 아직 계약 전 상태
  const canAcceptRequest = ['quote_arrived', 'negotiating', 'matching'].includes(request.status)
  const totalQuoteCount = typedQuotes.length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/customer/requests/${requestId}`}
        className="mb-4 block text-sm text-ink-subtle hover:text-brand"
      >
        ← {request.site_name}
      </Link>
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-ink">분야별 공장 견적서</h1>
      <p className="mb-6 text-sm text-ink-muted">
        분야마다 가장 좋은 공장을 선택해 계약할 수 있습니다.
      </p>

      {request.status === 'contracted' && (
        <div className="mb-4 rounded-control border border-success/20 bg-success-tint px-4 py-3 text-sm font-medium text-success">
          모든 분야 계약이 확정되었습니다. 소핏 담당자가 이후 진행을 안내드립니다.
        </div>
      )}

      {totalQuoteCount === 0 ? (
        <EmptyState
          title="아직 도착한 견적서가 없습니다."
          description="공장이 분야별 견적서를 제출하면 이 페이지에 표시됩니다."
        />
      ) : (
        <div className="space-y-8">
          {sortedItems.map((item) => {
            const factoryMap = byItem.get(item.id)
            const groups = factoryMap
              ? Array.from(factoryMap.values()).sort(
                  (a, b) => (a.quotes[0]?.total_cost ?? 0) - (b.quotes[0]?.total_cost ?? 0),
                )
              : []
            const isContracted = item.status === 'contracted'
            const canAcceptItem = canAcceptRequest && !isContracted
            const label = CATEGORY_LABELS[item.category as CategoryKey] ?? item.category

            return (
              <section key={item.id}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">{label}</h2>
                  {isContracted ? (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">
                      계약 확정
                    </span>
                  ) : (
                    <span className="text-xs text-ink-subtle">견적 {groups.length}건</span>
                  )}
                </div>

                {groups.length === 0 ? (
                  <p className="rounded-card border border-dashed border-border bg-surface-muted px-4 py-5 text-center text-sm text-ink-subtle">
                    아직 이 분야의 견적서가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group, idx) => (
                      <QuoteVersionCard
                        key={group.matchId}
                        factory={group.factory}
                        quotes={group.quotes}
                        isLowest={idx === 0 && group.quotes[0]?.status !== 'accepted'}
                        requestId={requestId}
                        matchId={group.matchId}
                        itemId={item.id}
                        canAccept={canAcceptItem}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {canAcceptRequest && totalQuoteCount > 0 && (
        <p className="mt-8 text-center text-xs text-ink-subtle">
          각 분야에서 원하는 공장의 &quot;이 견적서로 계약하기&quot;를 누르면 분야별 계약이 확정됩니다.
        </p>
      )}
    </div>
  )
}
