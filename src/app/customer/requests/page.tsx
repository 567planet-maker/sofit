import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus } from '@/types'

const TABS: { label: string; value: string }[] = [
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

export default async function CustomerRequestsPage({
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
    .select('id, site_name, company_name, status, created_at')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  const filterStatuses = TAB_STATUSES[tab]
  if (filterStatuses) {
    query = query.in('status', filterStatuses)
  }

  const { data: requests = [] } = await query

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">내 견적 요청</h1>
        <Link
          href="/customer/request"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + 새 견적 요청
        </Link>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/customer/requests?status=${t.value}`}
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
      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">해당 상태의 견적 요청이 없습니다.</p>
          <Link
            href="/customer/request"
            className="mt-4 inline-block rounded-xl border border-indigo-200 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
          >
            첫 견적 요청하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li key={req.id}>
              <Link
                href={`/customer/requests/${req.id}`}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{req.site_name}</p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{req.company_name}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(req.created_at)}</p>
                </div>
                <div className="ml-4 flex flex-shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={req.status as QuoteRequestStatus} />
                  <span className="text-xs text-gray-300">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
