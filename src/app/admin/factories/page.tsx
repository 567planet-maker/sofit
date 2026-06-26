import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Tabs, PageHeader, EmptyState, Badge, type TabItem, type BadgeTone } from '@/components/ui'
import type { FactoryStatus } from '@/types'

const TABS: TabItem[] = [
  { label: '승인 대기', value: 'pending' },
  { label: '활성', value: 'active' },
  { label: '정지', value: 'suspended' },
  { label: '반려', value: 'rejected' },
]

const STATUS_MAP: Record<FactoryStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: '승인 대기', tone: 'warning' },
  active: { label: '활성', tone: 'success' },
  suspended: { label: '정지', tone: 'neutral' },
  rejected: { label: '반려', tone: 'danger' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function AdminFactoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: tab = 'pending' } = await searchParams
  const supabase = await createClient()

  const { data: factories } = await supabase
    .from('factories')
    .select('id, company_name, location, status, created_at, users(name, email)')
    .eq('status', tab)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader title="공장 관리" description="입점 신청을 검수하고 공장 상태를 관리합니다." />

      <Tabs items={TABS} active={tab} basePath="/admin/factories" className="mb-6" />

      {/* 목록 */}
      {!factories || factories.length === 0 ? (
        <EmptyState title="해당 상태의 공장이 없습니다." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">등록일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">업체명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">위치</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">대표자</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">상태</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(factories as any[]).map((f) => {
                const statusInfo = STATUS_MAP[f.status as FactoryStatus]
                return (
                  <tr key={f.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-4 text-ink-muted">{formatDate(f.created_at)}</td>
                    <td className="px-5 py-4 font-medium text-ink">{f.company_name}</td>
                    <td className="px-5 py-4 text-ink-muted">{f.location ?? '-'}</td>
                    <td className="px-5 py-4 text-ink-muted">
                      {f.users?.name ?? f.users?.email ?? '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/factories/${f.id}`} className="font-medium text-brand hover:text-brand-hover">
                        상세 →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
