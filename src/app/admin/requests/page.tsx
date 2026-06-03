import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus } from '@/types'

const TABS = [
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
    .select('id, site_name, company_name, business_type, status, created_at')
    .order('created_at', { ascending: false })

  const filterStatuses = TAB_STATUSES[tab]
  if (filterStatuses) {
    query = query.in('status', filterStatuses)
  }

  const { data: requests = [] } = await query

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">전체 견적 요청</h1>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/requests?status=${t.value}`}
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

      {/* 목록 테이블 */}
      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">해당 상태의 견적 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">접수일</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">업체명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">현장명</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">업종</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className={`hover:bg-gray-50 ${req.status === 'submitted' ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-5 py-4 text-gray-500">{formatDate(req.created_at)}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{req.company_name}</td>
                  <td className="px-5 py-4 text-gray-700">{req.site_name}</td>
                  <td className="px-5 py-4 text-gray-500">{req.business_type ?? '-'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status as QuoteRequestStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="text-indigo-600 hover:underline"
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
