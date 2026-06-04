import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteVersionCard, { type QuoteVersion, type FactoryInfo } from './QuoteVersionCard'

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

  // 모든 버전(submitted + superseded) 조회 — version 내림차순
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
    .in('status', ['submitted', 'superseded'])
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/customer/requests/${requestId}`}
        className="mb-4 block text-sm text-indigo-500 hover:underline"
      >
        ← {request.site_name}
      </Link>
      <h1 className="mb-6 text-xl font-bold text-gray-900">공장 견적서</h1>

      {factoryGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">아직 도착한 견적서가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-300">공장 견적 검토 후 이 페이지에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {factoryGroups.map((group, idx) => (
            <QuoteVersionCard
              key={group.matchId}
              factory={group.factory}
              quotes={group.quotes}
              isLowest={idx === 0}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        견적서 선택 및 계약 진행은 소핏 담당자가 안내드립니다.
      </p>
    </div>
  )
}
