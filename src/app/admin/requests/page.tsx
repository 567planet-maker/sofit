import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import { Tabs, PageHeader, EmptyState, type TabItem } from '@/components/ui'
import type { QuoteRequestStatus } from '@/types'

const TABS: TabItem[] = [
  { label: '전체', value: 'all' },
  { label: '신규 접수', value: 'submitted' },
  { label: '검토중', value: 'reviewing' },
  { label: '매칭중', value: 'matching' },
  { label: '견적 도착', value: 'quote_arrived' },
  { label: '소통·계약', value: 'contracted' },
  { label: '완료', value: 'completed' },
]

const TAB_STATUSES: Record<string, QuoteRequestStatus[]> = {
  submitted: ['submitted'],
  reviewing: ['reviewing'],
  matching: ['matching'],
  quote_arrived: ['quote_arrived', 'negotiating'],
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

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: tab = 'all' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('quote_requests')
    .select('id, site_name, business_type, status, created_at')
    .order('created_at', { ascending: false })

  const filterStatuses = TAB_STATUSES[tab]
  if (filterStatuses) {
    query = query.in('status', filterStatuses)
  }

  const { data: requests = [] } = await query

  return (
    <div className="p-8">
      <PageHeader title="전체 견적 요청" description="접수된 요청을 검수하고 공장에 매칭합니다." />

      <Tabs items={TABS} active={tab} basePath="/admin/requests" className="mb-6" />

      {/* 목록 테이블 */}
      {!requests || requests.length === 0 ? (
        <EmptyState title="해당 상태의 견적 요청이 없습니다." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">접수일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">현장명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">업종</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">상태</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className={`hover:bg-surface-muted ${req.status === 'submitted' ? 'bg-brand-tint/40' : ''}`}
                >
                  <td className="px-5 py-4 text-ink-muted">{formatDate(req.created_at)}</td>
                  <td className="px-5 py-4 font-medium text-ink">{req.site_name}</td>
                  <td className="px-5 py-4 text-ink-muted">{req.business_type ?? '-'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status as QuoteRequestStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="text-brand hover:underline"
                    >
                      상세 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
