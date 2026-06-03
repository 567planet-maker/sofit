import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserRole, FactoryStatus } from '@/types'

const ROLE_MAP: Record<UserRole, { label: string; className: string }> = {
  customer: { label: '고객', className: 'bg-blue-50 text-blue-700' },
  factory: { label: '공장', className: 'bg-purple-50 text-purple-700' },
  admin: { label: '관리자', className: 'bg-gray-100 text-gray-700' },
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

  const TABS = [
    { label: '전체', value: 'all' },
    { label: '고객', value: 'customer' },
    { label: '공장', value: 'factory' },
    { label: '관리자', value: 'admin' },
  ]

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">사용자 관리</h1>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/users?role=${t.value}`}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              roleFilter === t.value
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 목록 */}
      {!users || users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">가입일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">이름</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">이메일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">역할</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">추가 정보</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users as any[]).map((u) => {
                const roleInfo = ROLE_MAP[u.role as UserRole] ?? { label: u.role, className: 'bg-gray-100 text-gray-600' }
                const factory = factoryMap[u.id]
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{u.name ?? '-'}</td>
                    <td className="px-5 py-4 text-gray-600">{u.email ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleInfo.className}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {factory ? (
                        <Link
                          href={`/admin/factories/${factory.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <span className="text-gray-700">{factory.company_name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              factory.status === 'active'
                                ? 'bg-green-50 text-green-700'
                                : factory.status === 'pending'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {FACTORY_STATUS_MAP[factory.status as FactoryStatus] ?? factory.status}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
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
