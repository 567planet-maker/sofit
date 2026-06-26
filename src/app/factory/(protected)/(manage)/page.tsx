import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, Badge, Stat, EmptyState, buttonVariants, type BadgeTone } from '@/components/ui'

function StatLink({
  label,
  count,
  unit,
  href,
}: {
  label: string
  count: number
  unit?: string
  href: string
}) {
  return (
    <Link href={href} className="block transition-shadow hover:shadow-card-hover rounded-card">
      <Stat label={label} value={count} unit={unit} />
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

  const MATCH_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
    pending: { label: '검토 필요', tone: 'warning' },
    confirmed: { label: '수락됨', tone: 'success' },
    rejected: { label: '거절됨', tone: 'neutral' },
    cancelled: { label: '취소됨', tone: 'neutral' },
  }

  return (
    <div className="space-y-8">

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatLink label="신규 매칭 요청" count={pendingCount ?? 0} unit="건" href="/factory/requests?status=pending" />
        <StatLink label="수락된 요청" count={confirmedCount ?? 0} unit="건" href="/factory/requests?status=confirmed" />
        <StatLink label="제출한 견적서" count={submittedQuoteCount ?? 0} unit="건" href="/factory/requests?status=confirmed" />
      </div>

      {/* 최근 매칭 요청 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">최근 매칭 요청</h2>
          <Link href="/factory/requests" className="text-sm font-medium text-brand hover:text-brand-hover">
            전체 보기 →
          </Link>
        </div>

        {!recentMatches || recentMatches.length === 0 ? (
          <EmptyState
            title="아직 매칭된 견적 요청이 없습니다."
            description="포트폴리오를 등록하면 매칭 기회가 늘어납니다."
            action={
              <Link href="/factory/portfolios" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                포트폴리오 등록하기
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {recentMatches.map((match) => {
              const raw = match.quote_requests
              const req = (Array.isArray(raw) ? raw[0] : raw) as {
                id: string
                site_name: string
                company_name: string
                status: string
              } | null
              if (!req) return null
              const statusInfo = MATCH_STATUS[match.status] ?? { label: match.status, tone: 'neutral' as BadgeTone }
              return (
                <Link
                  key={match.id}
                  href={`/factory/requests/${req.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors first:rounded-t-card last:rounded-b-card hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{req.site_name}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">{req.company_name}</p>
                  </div>
                  <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                </Link>
              )
            })}
          </Card>
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
            className="flex flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface py-5 text-center shadow-card transition-shadow hover:shadow-card-hover"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="whitespace-pre-line text-xs font-medium text-ink-muted">
              {item.label}
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
