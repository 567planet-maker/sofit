import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MatchStatus } from '@/types'

const TABS: { label: string; value: string }[] = [
  { label: '전체', value: 'all' },
  { label: '신규', value: 'pending' },
  { label: '수락됨', value: 'confirmed' },
  { label: '거절됨', value: 'rejected' },
]

const MATCH_STATUS_MAP: Record<MatchStatus, { label: string; className: string }> = {
  pending: { label: '검토 필요', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  confirmed: { label: '수락됨', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  rejected: { label: '거절됨', className: 'bg-gray-100 text-gray-500 ring-gray-500/20' },
  cancelled: { label: '취소됨', className: 'bg-gray-100 text-gray-500 ring-gray-500/20' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function FactoryRequestsPage({
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

  const { data: factory } = await supabase
    .from('factories')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!factory) notFound()

  let query = supabase
    .from('matches')
    .select(
      `
      id, status, created_at,
      quote_requests!inner(id, site_name, company_name, status, address, created_at)
    `,
    )
    .eq('factory_id', factory.id)
    .order('created_at', { ascending: false })

  if (tab !== 'all') {
    query = query.eq('status', tab)
  }

  const { data: matches = [] } = await query

  type MatchRow = {
    id: string
    status: MatchStatus
    created_at: string
    quote_requests: {
      id: string
      site_name: string
      company_name: string
      status: string
      address: string | null
      created_at: string
    }
  }

  const typedMatches = (matches ?? []) as unknown as MatchRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">매칭된 견적 요청</h1>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/factory/requests?status=${t.value}`}
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
      {typedMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">해당 상태의 매칭 요청이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {typedMatches.map((match) => {
            const req = match.quote_requests
            const statusInfo =
              MATCH_STATUS_MAP[match.status] ?? MATCH_STATUS_MAP.pending
            return (
              <li key={match.id}>
                <Link
                  href={`/factory/requests/${req.id}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{req.site_name}</p>
                    <p className="mt-0.5 truncate text-sm text-gray-500">{req.company_name}</p>
                    {req.address && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">{req.address}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      매칭 {formatDate(match.created_at)}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-gray-300">→</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
