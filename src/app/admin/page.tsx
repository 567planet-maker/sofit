import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({
  label,
  value,
  href,
  urgent,
}: {
  label: string
  value: number
  href: string
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        urgent && value > 0
          ? 'border-red-200 bg-red-50'
          : 'border-gray-100 bg-white'
      }`}
    >
      <p className={`text-3xl font-bold ${urgent && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`mt-1 text-sm ${urgent && value > 0 ? 'text-red-600' : 'text-gray-500'}`}>
        {label}
      </p>
    </Link>
  )
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: submitted },
    { count: reviewing },
    { count: inProgress },
    { count: pendingFactories },
    { count: activeFactories },
  ] = await Promise.all([
    supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reviewing'),
    supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['matching', 'quote_arrived', 'negotiating', 'contracted', 'in_progress']),
    supabase
      .from('factories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('factories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const { data: recentRequests } = await supabase
    .from('quote_requests')
    .select('id, site_name, company_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h1>

      {/* 요약 카드 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="신규 접수"
          value={submitted ?? 0}
          href="/admin/requests?status=submitted"
          urgent
        />
        <StatCard
          label="검토중"
          value={reviewing ?? 0}
          href="/admin/requests?status=reviewing"
        />
        <StatCard
          label="매칭·견적 진행"
          value={inProgress ?? 0}
          href="/admin/requests?status=matching"
        />
        <StatCard
          label="공장 승인 대기"
          value={pendingFactories ?? 0}
          href="/admin/factories?status=pending"
          urgent
        />
        <StatCard
          label="활성 공장"
          value={activeFactories ?? 0}
          href="/admin/factories?status=active"
        />
      </div>

      {/* 최근 견적 요청 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">최근 견적 요청</h2>
          <Link href="/admin/requests" className="text-sm text-indigo-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {!recentRequests || recentRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">견적 요청이 없습니다.</p>
          ) : (
            recentRequests.map((req, i) => (
              <Link
                key={req.id}
                href={`/admin/requests/${req.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 ${
                  i > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{req.site_name}</p>
                  <p className="truncate text-sm text-gray-500">{req.company_name}</p>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                  <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                  <StatusBadge status={req.status as QuoteRequestStatus} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
