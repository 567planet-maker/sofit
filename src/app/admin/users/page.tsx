import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Tabs, PageHeader, EmptyState, Badge, type TabItem, type BadgeTone } from '@/components/ui'
import type { UserRole, FactoryStatus } from '@/types'

const ROLE_MAP: Record<UserRole, { label: string; tone: BadgeTone }> = {
  customer: { label: '고객', tone: 'info' },
  factory: { label: '공장', tone: 'purple' },
  admin: { label: '관리자', tone: 'neutral' },
}

const FACTORY_STATUS_MAP: Record<FactoryStatus, string> = {
  pending: '승인 대기',
  active: '활성',
  suspended: '정지',
  rejected: '반려',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role: roleFilter = 'all' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select('id, name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }

  const { data: users = [] } = await query

  // 공장 계정이면 factory 정보도 가져오기
  const factoryUserIds = (users ?? [])
    .filter((u) => u.role === 'factory')
    .map((u) => u.id)

  const { data: factories } = factoryUserIds.length > 0
    ? await supabase
        .from('factories')
        .select('user_id, id, company_name, status')
        .in('user_id', factoryUserIds)
    : { data: [] }

  const factoryMap: Record<string, { id: string; company_name: string; status: string }> = {}
  for (const f of factories ?? []) {
    factoryMap[f.user_id] = f
  }

  const TABS: TabItem[] = [
    { label: '전체', value: 'all' },
    { label: '고객', value: 'customer' },
    { label: '공장', value: 'factory' },
    { label: '관리자', value: 'admin' },
  ]

  return (
    <div className="p-8">
      <PageHeader title="사용자 관리" description="가입한 고객·공장·관리자 계정을 확인합니다." />

      <Tabs items={TABS} active={roleFilter} basePath="/admin/users" paramName="role" className="mb-6" />

      {/* 목록 */}
      {!users || users.length === 0 ? (
        <EmptyState title="사용자가 없습니다." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">가입일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">이름</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">이메일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">역할</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-ink-subtle">추가 정보</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users as any[]).map((u) => {
                const roleInfo = ROLE_MAP[u.role as UserRole] ?? { label: u.role, tone: 'neutral' as BadgeTone }
                const factory = factoryMap[u.id]
                return (
                  <tr key={u.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-4 text-ink-muted">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4 font-medium text-ink">{u.name ?? '-'}</td>
                    <td className="px-5 py-4 text-ink-muted">{u.email ?? '-'}</td>
                    <td className="px-5 py-4">
                      <Badge tone={roleInfo.tone}>{roleInfo.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {factory ? (
                        <Link
                          href={`/admin/factories/${factory.id}`}
                          className="flex items-center gap-2 hover:text-brand"
                        >
                          <span className="font-medium text-ink">{factory.company_name}</span>
                          <Badge
                            tone={
                              factory.status === 'active'
                                ? 'success'
                                : factory.status === 'pending'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {FACTORY_STATUS_MAP[factory.status as FactoryStatus] ?? factory.status}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-ink-subtle">-</span>
                      )}
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
