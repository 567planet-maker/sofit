import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { FactoryStatus } from '@/types'

const TABS: { label: string; value: string }[] = [
  { label: '승인 대기', value: 'pending' },
  { label: '활성', value: 'active' },
  { label: '정지', value: 'suspended' },
  { label: '반려', value: 'rejected' },
]

const STATUS_MAP: Record<FactoryStatus, { label: string; className: string }> = {
  pending: { label: '승인 대기', className: 'bg-yellow-50 text-yellow-700' },
  active: { label: '활성', className: 'bg-green-50 text-green-700' },
  suspended: { label: '정지', className: 'bg-gray-100 text-gray-500' },
  rejected: { label: '반려', className: 'bg-red-50 text-red-600' },
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
      <h1 className="mb-6 text-xl font-bold text-gray-900">공장 관리</h1>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/factories?status=${t.value}`}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 목록 */}
      {!factories || factories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">해당 상태의 공장이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">등록일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">업체명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">위치</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">대표자</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(factories as any[]).map((f) => {
                const statusInfo = STATUS_MAP[f.status as FactoryStatus]
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-500">{formatDate(f.created_at)}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{f.company_name}</td>
                    <td className="px-5 py-4 text-gray-500">{f.location ?? '-'}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {f.users?.name ?? f.users?.email ?? '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/factories/${f.id}`}
                        className="text-indigo-600 hover:underline"
                      >
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
