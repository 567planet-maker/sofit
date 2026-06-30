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
  const isUrgent = urgent && value > 0
  return (
    <Link
      href={href}
      className={`rounded-card border p-5 shadow-card transition-shadow hover:shadow-card-hover ${
        isUrgent ? 'border-danger/30 bg-danger-tint' : 'border-border bg-surface'
      }`}
    >
      <p className={`text-3xl font-semibold tracking-tight ${isUrgent ? 'text-danger' : 'text-ink'}`}>
        {value}
      </p>
      <p className={`mt-1 text-sm font-medium ${isUrgent ? 'text-danger' : 'text-ink-muted'}`}>
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
    .select('id, site_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-ink">대시보드</h1>

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
          <h2 className="font-semibold text-ink">최근 견적 요청</h2>
          <Link href="/admin/requests" className="text-sm font-medium text-brand hover:text-brand-hover">
            전체 보기 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {!recentRequests || recentRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-subtle">견적 요청이 없습니다.</p>
          ) : (
            recentRequests.map((req, i) => (
              <Link
                key={req.id}
                href={`/admin/requests/${req.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-surface-muted ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{req.site_name}</p>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-subtle">{formatDate(req.created_at)}</span>
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
