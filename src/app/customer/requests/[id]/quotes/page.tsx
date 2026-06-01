import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatKrw(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

type QuoteRow = {
  id: string
  total_cost: number
  delivery_days: number | null
  note: string | null
  status: string
  created_at: string
  matches: {
    id: string
    status: string
    factories: {
      id: string
      company_name: string
      location: string | null
      rating_avg: number
    }
  }
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

  // 제출된 견적서만 조회 (status = 'submitted')
  const { data: quotes } = await supabase
    .from('factory_quotes')
    .select(
      `
      id, total_cost, delivery_days, note, status, created_at,
      matches!inner(
        id, status,
        factories!inner(id, company_name, location, rating_avg)
      )
    `,
    )
    .eq('matches.request_id', requestId)
    .eq('status', 'submitted')
    .order('total_cost', { ascending: true })

  const typedQuotes = (quotes ?? []) as unknown as QuoteRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/customer/requests/${requestId}`}
        className="mb-4 block text-sm text-indigo-500 hover:underline"
      >
        ← {request.site_name}
      </Link>
      <h1 className="mb-6 text-xl font-bold text-gray-900">공장 견적서</h1>

      {typedQuotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">아직 도착한 견적서가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-300">공장 견적 검토 후 이 페이지에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {typedQuotes.map((quote, idx) => {
            const factory = quote.matches.factories
            return (
              <div
                key={quote.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  idx === 0 ? 'border-indigo-200 ring-1 ring-indigo-200' : 'border-gray-100'
                }`}
              >
                {idx === 0 && (
                  <span className="mb-3 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    최저가
                  </span>
                )}

                {/* 공장 정보 */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{factory.company_name}</p>
                    {factory.location && (
                      <p className="mt-0.5 text-sm text-gray-500">{factory.location}</p>
                    )}
                    {factory.rating_avg > 0 && (
                      <p className="mt-0.5 text-sm text-yellow-600">
                        ★ {factory.rating_avg.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/portfolios?factory=${factory.id}`}
                    className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    포트폴리오 보기
                  </Link>
                </div>

                {/* 견적 금액·납기 */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
                  <div>
                    <p className="text-xs text-gray-500">견적 금액</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">
                      {formatKrw(quote.total_cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">납기</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">
                      {quote.delivery_days != null ? `${quote.delivery_days}일` : '미정'}
                    </p>
                  </div>
                </div>

                {quote.note && (
                  <p className="mt-3 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-600">
                    {quote.note}
                  </p>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  {new Date(quote.created_at).toLocaleDateString('ko-KR')} 제출
                </p>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        견적서 선택 및 계약 진행은 소핏 담당자가 안내드립니다.
      </p>
    </div>
  )
}
