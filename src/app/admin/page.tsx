import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import CategoryDemandStats from '@/components/admin/CategoryDemandStats'
import type { QuoteRequestStatus } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 렌더 본문에서 Date.now()를 직접 호출하면 react-hooks/purity 규칙에 걸리므로
// 시각 계산은 모듈 스코프 헬퍼로 분리한다.
function hoursAgoISO(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

const SECURITY_EVENT_LABELS: Record<string, string> = {
  rate_limited: '요청 제한 초과',
  login_failed: '로그인 실패',
  oauth_state_mismatch: 'OAuth 위조 의심',
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
    { count: securityEvents24h },
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
    supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoursAgoISO(24)),
  ])

  const { data: recentRequests } = await supabase
    .from('quote_requests')
    .select('id, site_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: recentSecurityEvents } = await supabase
    .from('security_events')
    .select('id, type, identity, ip, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-ink">대시보드</h1>

      {/* 요약 카드 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
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
        <StatCard
          label="보안 이벤트 (24h)"
          value={securityEvents24h ?? 0}
          href="/admin#security-events"
          urgent
        />
      </div>

      {/* 분야별 수요 · 공장 커버리지 */}
      <CategoryDemandStats />

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

      {/* 최근 보안 이벤트 */}
      <section id="security-events" className="mt-8 scroll-mt-8">
        <h2 className="mb-3 font-semibold text-ink">최근 보안 이벤트</h2>
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {!recentSecurityEvents || recentSecurityEvents.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-subtle">최근 보안 이벤트가 없습니다.</p>
          ) : (
            recentSecurityEvents.map((ev, i) => (
              <div
                key={ev.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex-shrink-0 rounded-full bg-danger-tint px-2.5 py-0.5 text-xs font-medium text-danger">
                    {SECURITY_EVENT_LABELS[ev.type] ?? ev.type}
                  </span>
                  <span className="truncate text-sm text-ink-muted">
                    {ev.identity ?? '—'}
                    {ev.ip ? ` · ${ev.ip}` : ''}
                  </span>
                </div>
                <span className="ml-4 flex-shrink-0 text-xs text-ink-subtle">
                  {formatDate(ev.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
