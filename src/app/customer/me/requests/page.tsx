import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import { Card, Tabs, EmptyState, buttonVariants, type TabItem } from '@/components/ui'
import type { QuoteRequestStatus } from '@/types'

const TABS: TabItem[] = [
  { label: '전체', value: 'all' },
  { label: '접수·검토', value: 'submitted' },
  { label: '매칭·견적', value: 'matching' },
  { label: '계약·시공', value: 'contracted' },
  { label: '완료', value: 'completed' },
]

const TAB_STATUSES: Record<string, QuoteRequestStatus[]> = {
  submitted: ['submitted', 'reviewing'],
  matching: ['matching', 'quote_arrived', 'negotiating'],
  contracted: ['contracted', 'in_progress'],
  completed: ['completed'],
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: tab = 'all' } = await searchParams

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

  let query = supabase
    .from('quote_requests')
    .select('id, title, site_name, company_name, status, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  const filterStatuses = TAB_STATUSES[tab]
  if (filterStatuses) {
    query = query.in('status', filterStatuses)
  }

  const { data: requests = [] } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Tabs items={TABS} active={tab} basePath="/customer/me/requests" />
        <Link href="/customer/request/new" className={buttonVariants({ size: 'sm' })}>
          + 새 견적 요청
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <EmptyState
          title="해당 상태의 견적 요청이 없습니다."
          action={
            <Link
              href="/customer/request/new"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              첫 견적 요청하기
            </Link>
          }
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {requests.map((req) => {
            // 임시저장(draft)은 읽기 상세가 아니라 작성 화면으로 이어쓰기
            const isDraft = req.status === 'draft'
            const displayTitle =
              req.title || req.site_name || (isDraft ? '제목 없는 임시저장' : '제목 없음')
            return (
              <Link
                key={req.id}
                href={isDraft ? `/customer/request/${req.id}` : `/customer/requests/${req.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors first:rounded-t-card last:rounded-b-card hover:bg-surface-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{displayTitle}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {req.company_name ? `${req.company_name} · ` : ''}
                    {formatDate(req.created_at)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {isDraft && (
                    <span className="text-sm font-medium text-brand">이어서 작성</span>
                  )}
                  <StatusBadge status={req.status as QuoteRequestStatus} />
                  <span className="text-lg leading-none text-ink-subtle">›</span>
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </div>
  )
}
