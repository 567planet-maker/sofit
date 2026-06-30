import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, Badge, EmptyState, type BadgeTone } from '@/components/ui'
import type { MatchStatus } from '@/types'

const MATCH_STATUS_MAP: Record<MatchStatus, { label: string; tone: BadgeTone }> = {
  pending:   { label: '검토 필요', tone: 'warning' },
  confirmed: { label: '참여 중',   tone: 'brand' },
  rejected:  { label: '거절됨',    tone: 'neutral' },
  cancelled: { label: '취소됨',    tone: 'neutral' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

type RequestRow = {
  id: string
  site_name: string
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
    .select('id, site_name, status, created_at')
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

  const RequestRow = ({ req, match }: { req: RequestRow; match?: MatchRow }) => (
    <Link
      href={`/factory/requests/${req.id}`}
      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors first:rounded-t-card last:rounded-b-card hover:bg-surface-muted"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{req.site_name}</p>
        <p className="mt-1 text-xs text-ink-subtle">접수 {formatDate(req.created_at)}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {match ? (
          <Badge tone={MATCH_STATUS_MAP[match.status]?.tone ?? 'neutral'}>
            {MATCH_STATUS_MAP[match.status]?.label}
          </Badge>
        ) : (
          <Badge tone="success">신규</Badge>
        )}
        <span className="text-lg leading-none text-ink-subtle">›</span>
      </div>
    </Link>
  )

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">{children}</h2>
  )

  return (
    <div>

      {/* 신규 요청 */}
      {newRequests.length > 0 && (
        <section className="mb-8">
          <SectionTitle>
            신규 요청
            <Badge tone="success">{newRequests.length}</Badge>
          </SectionTitle>
          <Card className="divide-y divide-border overflow-hidden p-0">
            {newRequests.map((req) => (
              <RequestRow key={req.id} req={req} />
            ))}
          </Card>
        </section>
      )}

      {/* 내 참여 요청 */}
      {activeRequests.length > 0 && (
        <section className="mb-8">
          <SectionTitle>내 참여 요청</SectionTitle>
          <Card className="divide-y divide-border overflow-hidden p-0">
            {activeRequests.map((req) => (
              <RequestRow key={req.id} req={req} match={matchMap.get(req.id)} />
            ))}
          </Card>
        </section>
      )}

      {/* 거절/취소된 요청 */}
      {closedRequests.length > 0 && (
        <section className="mb-8">
          <SectionTitle>
            <span className="text-ink-subtle">참여 종료</span>
          </SectionTitle>
          <Card className="divide-y divide-border overflow-hidden p-0 opacity-60">
            {closedRequests.map((req) => (
              <RequestRow key={req.id} req={req} match={matchMap.get(req.id)} />
            ))}
          </Card>
        </section>
      )}

      {newRequests.length === 0 && activeRequests.length === 0 && closedRequests.length === 0 && (
        <EmptyState title="현재 접수된 견적 요청이 없습니다." />
      )}
    </div>
  )
}
