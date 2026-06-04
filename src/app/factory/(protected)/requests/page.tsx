import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MatchStatus } from '@/types'

const MATCH_STATUS_MAP: Record<MatchStatus, { label: string; className: string }> = {
  pending:   { label: '검토 필요', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  confirmed: { label: '참여 중',   className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  rejected:  { label: '거절됨',    className: 'bg-gray-100 text-gray-500 ring-gray-500/20' },
  cancelled: { label: '취소됨',    className: 'bg-gray-100 text-gray-500 ring-gray-500/20' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

type RequestRow = {
  id: string
  site_name: string
  company_name: string
  address: string | null
  status: string
  created_at: string
}

type MatchRow = {
  id: string
  request_id: string
  status: MatchStatus
}

export default async function FactoryRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: factory } = await supabase
    .from('factories')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!factory) notFound()

  // 이 공장이 볼 수 있는 모든 활성 요청서 (신규 RLS 적용)
  const { data: allRequests = [] } = await supabase
    .from('quote_requests')
    .select('id, site_name, company_name, address, status, created_at')
    .not('status', 'in', '(contracted,in_progress,completed)')
    .order('created_at', { ascending: false })

  // 이 공장의 매칭 현황
  const { data: myMatches = [] } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('factory_id', factory.id)

  const matchMap = new Map<string, MatchRow>(
    (myMatches as MatchRow[]).map((m) => [m.request_id, m])
  )

  const requests = (allRequests as RequestRow[])
  const newRequests = requests.filter((r) => !matchMap.has(r.id))
  const activeRequests = requests.filter((r) => {
    const m = matchMap.get(r.id)
    return m && m.status !== 'rejected' && m.status !== 'cancelled'
  })
  const closedRequests = requests.filter((r) => {
    const m = matchMap.get(r.id)
    return m && (m.status === 'rejected' || m.status === 'cancelled')
  })

  const RequestCard = ({
    req,
    match,
  }: {
    req: RequestRow
    match?: MatchRow
  }) => (
    <Link
      href={`/factory/requests/${req.id}`}
      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900">{req.site_name}</p>
        <p className="mt-0.5 truncate text-sm text-gray-500">{req.company_name}</p>
        {req.address && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{req.address}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">접수 {formatDate(req.created_at)}</p>
      </div>
      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        {match ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              MATCH_STATUS_MAP[match.status]?.className ?? ''
            }`}
          >
            {MATCH_STATUS_MAP[match.status]?.label}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            신규
          </span>
        )}
        <span className="text-xs text-gray-300">→</span>
      </div>
    </Link>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">견적 요청</h1>

      {/* 신규 요청 */}
      {newRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            신규 요청
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              {newRequests.length}
            </span>
          </h2>
          <ul className="space-y-3">
            {newRequests.map((req) => (
              <li key={req.id}>
                <RequestCard req={req} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 내 참여 요청 */}
      {activeRequests.length > 0 && (
        <section className={newRequests.length > 0 ? '' : ''}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">내 참여 요청</h2>
          <ul className="space-y-3">
            {activeRequests.map((req) => (
              <li key={req.id}>
                <RequestCard req={req} match={matchMap.get(req.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 거절/취소된 요청 */}
      {closedRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">참여 종료</h2>
          <ul className="space-y-3 opacity-60">
            {closedRequests.map((req) => (
              <li key={req.id}>
                <RequestCard req={req} match={matchMap.get(req.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {newRequests.length === 0 && activeRequests.length === 0 && closedRequests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">현재 접수된 견적 요청이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
