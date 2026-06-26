import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteVersionCard, { type QuoteVersion, type FactoryInfo } from './QuoteVersionCard'
import { EmptyState } from '@/components/ui'

type QuoteRow = QuoteVersion & {
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

  // submitted + superseded + accepted 모두 조회 — version 내림차순
  const { data: allQuotes } = await supabase
    .from('factory_quotes')
    .select(
      `
      id, version, is_latest,
      material_cost, labor_cost, delivery_cost,
      install_cost, demolition_cost, extra_cost, margin,
      total_cost, delivery_days, note, status, created_at,
      matches!inner(
        id, status,
        factories!inner(id, company_name, location, rating_avg)
      )
    `,
    )
    .eq('matches.request_id', requestId)
    .in('status', ['submitted', 'superseded', 'accepted'])
    .order('version', { ascending: false })

  const typedQuotes = (allQuotes ?? []) as unknown as QuoteRow[]

  // 공장별로 그룹핑 (matchId 기준, 이미 version 내림차순 정렬됨)
  const factoryMap = new Map<string, FactoryGroup>()
  for (const quote of typedQuotes) {
    const matchId = quote.matches.id
    if (!factoryMap.has(matchId)) {
      factoryMap.set(matchId, {
        matchId,
        factory: quote.matches.factories,
        quotes: [],
      })
    }
    const { matches: _m, ...quoteData } = quote
    factoryMap.get(matchId)!.quotes.push(quoteData as QuoteVersion)
  }

  // 최신 견적 총액 기준 오름차순 정렬 (최저가 상단)
  const factoryGroups = Array.from(factoryMap.values()).sort(
    (a, b) => (a.quotes[0]?.total_cost ?? 0) - (b.quotes[0]?.total_cost ?? 0),
  )

  // 수락 가능 여부: 아직 계약 전이고 submitted 상태의 견적이 있을 때
  const canAccept = ['quote_arrived', 'negotiating', 'matching'].includes(request.status)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/customer/requests/${requestId}`}
        className="mb-4 block text-sm text-ink-subtle hover:text-brand"
      >
        ← {request.site_name}
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-ink">공장 견적서</h1>

      {request.status === 'contracted' && (
        <div className="mb-4 rounded-control border border-success/20 bg-success-tint px-4 py-3 text-sm font-medium text-success">
          계약이 확정되었습니다. 소핏 담당자가 이후 진행을 안내드립니다.
        </div>
      )}

      {factoryGroups.length === 0 ? (
        <EmptyState
          title="아직 도착한 견적서가 없습니다."
          description="공장 견적 검토 후 이 페이지에 표시됩니다."
        />
      ) : (
        <div className="space-y-4">
          {factoryGroups.map((group, idx) => (
            <QuoteVersionCard
              key={group.matchId}
              factory={group.factory}
              quotes={group.quotes}
              isLowest={idx === 0 && group.quotes[0]?.status !== 'accepted'}
              requestId={requestId}
              matchId={group.matchId}
              canAccept={canAccept}
            />
          ))}
        </div>
      )}

      {canAccept && factoryGroups.length > 0 && (
        <p className="mt-6 text-center text-xs text-ink-subtle">
          원하는 공장의 견적서에서 &quot;이 견적서로 계약하기&quot;를 누르시면 계약이 확정됩니다.
        </p>
      )}
    </div>
  )
}
