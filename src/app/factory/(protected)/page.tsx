import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function StatCard({
  label,
  count,
  href,
  color,
}: {
  label: string
  count: number
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{count}</p>
    </Link>
  )
}

export default async function FactoryDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: factory } = await supabase
    .from('factories')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()
  if (!factory) notFound()

  // 통계 병렬 조회
  const [
    { count: pendingCount },
    { count: confirmedCount },
    { count: submittedQuoteCount },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('factory_id', factory.id)
      .eq('status', 'pending'),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('factory_id', factory.id)
      .eq('status', 'confirmed'),
    supabase
      .from('factory_quotes')
      .select('*, matches!inner(factory_id)', { count: 'exact', head: true })
      .eq('matches.factory_id', factory.id)
      .eq('status', 'submitted'),
  ])

  // 최근 매칭된 요청 (최대 5개)
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(
      `
      id, status, created_at,
      quote_requests(id, site_name, company_name, status)
    `,
    )
    .eq('factory_id', factory.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const MATCH_STATUS: Record<string, { label: string; className: string }> = {
    pending: { label: '검토 필요', className: 'bg-yellow-50 text-yellow-700' },
    confirmed: { label: '수락됨', className: 'bg-green-50 text-green-700' },
    rejected: { label: '거절됨', className: 'bg-gray-100 text-gray-500' },
    cancelled: { label: '취소됨', className: 'bg-gray-100 text-gray-500' },
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{factory.company_name}</h1>
        <p className="mt-1 text-sm text-gray-500">소핏 파트너 대시보드</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="신규 매칭 요청"
          count={pendingCount ?? 0}
          href="/factory/requests?status=pending"
          color={pendingCount ? 'text-orange-600' : 'text-gray-900'}
        />
        <StatCard
          label="수락된 요청"
          count={confirmedCount ?? 0}
          href="/factory/requests?status=confirmed"
          color="text-green-600"
        />
        <StatCard
          label="제출한 견적서"
          count={submittedQuoteCount ?? 0}
          href="/factory/requests?status=confirmed"
          color="text-indigo-600"
        />
      </div>

      {/* 최근 매칭 요청 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">최근 매칭 요청</h2>
          <Link
            href="/factory/requests"
            className="text-sm text-indigo-600 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>

        {!recentMatches || recentMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-gray-400">아직 매칭된 견적 요청이 없습니다.</p>
            <p className="mt-1 text-sm text-gray-300">포트폴리오를 등록하면 매칭 기회가 늘어납니다.</p>
            <Link
              href="/factory/portfolios"
              className="mt-4 inline-block rounded-xl border border-indigo-200 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              포트폴리오 등록하기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentMatches.map((match) => {
              const raw = match.quote_requests
              const req = (Array.isArray(raw) ? raw[0] : raw) as {
                id: string
                site_name: string
                company_name: string
                status: string
              } | null
              if (!req) return null
              const statusInfo = MATCH_STATUS[match.status] ?? {
                label: match.status,
                className: 'bg-gray-100 text-gray-600',
              }
              return (
                <li key={match.id}>
                  <Link
                    href={`/factory/requests/${req.id}`}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{req.site_name}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{req.company_name}</p>
                    </div>
                    <span
                      className={`ml-4 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 빠른 링크 */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: '/factory/portfolios', icon: '🖼', label: '포트폴리오\n관리' },
          { href: '/factory/requests', icon: '📋', label: '매칭 요청\n목록' },
          { href: '/factory/projects', icon: '🏗', label: '진행\n프로젝트' },
          { href: '/me', icon: '⚙️', label: '계정\n설정' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-5 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="whitespace-pre-line text-xs font-medium text-gray-600">
              {item.label}
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
