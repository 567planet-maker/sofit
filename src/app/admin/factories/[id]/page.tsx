import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FactoryStatus } from '@/types'
import FactoryActions from './FactoryActions'

const STATUS_MAP: Record<FactoryStatus, { label: string; className: string }> = {
  pending: { label: '승인 대기', className: 'bg-yellow-50 text-yellow-700' },
  active: { label: '활성', className: 'bg-green-50 text-green-700' },
  suspended: { label: '정지', className: 'bg-gray-100 text-gray-600' },
  rejected: { label: '반려', className: 'bg-red-50 text-red-600' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function AdminFactoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: factoryId } = await params
  const supabase = await createClient()

  const { data: factory } = await supabase
    .from('factories')
    .select('*, users(id, name, email, phone)')
    .eq('id', factoryId)
    .single()
  if (!factory) notFound()

  // 포트폴리오
  const { data: portfolios } = await supabase
    .from('factory_portfolios')
    .select('id, image_url, description, category, completed_at')
    .eq('factory_id', factoryId)
    .order('created_at', { ascending: false })

  // 매칭 이력
  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, created_at, quote_requests(site_name, company_name)')
    .eq('factory_id', factoryId)
    .order('created_at', { ascending: false })
    .limit(10)

  const statusInfo = STATUS_MAP[factory.status as FactoryStatus]

  // 사업자등록증 signed URL
  let bizDocUrl: string | null = null
  if (factory.biz_reg_url) {
    const { data } = await supabase.storage
      .from('factory-biz-docs')
      .createSignedUrl(factory.biz_reg_url, 3600)
    bizDocUrl = data?.signedUrl ?? null
  }

  // 포트폴리오 이미지 signed URLs
  const portfolioItems = await Promise.all(
    (portfolios ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from('factory-portfolios')
        .createSignedUrl(p.image_url, 3600)
      return { ...p, signedUrl: data?.signedUrl ?? p.image_url }
    }),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      {/* 헤더 */}
      <div>
        <Link href="/admin/factories" className="mb-2 block text-sm text-indigo-500 hover:underline">
          ← 공장 목록
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{factory.company_name}</h1>
            {factory.location && (
              <p className="mt-0.5 text-sm text-gray-500">{factory.location}</p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* 승인/반려/정지 액션 */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">심사 처리</h2>
        <FactoryActions factoryId={factoryId} currentStatus={factory.status as FactoryStatus} />
      </section>

      {/* 기본 정보 */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">기본 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-28 flex-shrink-0 text-gray-500">업체명</span>
            <span className="font-medium text-gray-800">{factory.company_name}</span>
          </div>
          {factory.location && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">위치</span>
              <span className="font-medium text-gray-800">{factory.location}</span>
            </div>
          )}
          {factory.description && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">소개</span>
              <span className="text-gray-700">{factory.description}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-28 flex-shrink-0 text-gray-500">등록일</span>
            <span className="text-gray-700">{formatDate(factory.created_at)}</span>
          </div>
          {factory.rating_avg > 0 && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">평점</span>
              <span className="text-yellow-600">★ {Number(factory.rating_avg).toFixed(1)}</span>
            </div>
          )}
        </div>
      </section>

      {/* 대표자 정보 */}
      {(factory as any).users && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">계정 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">이름</span>
              <span className="text-gray-800">{(factory as any).users.name ?? '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">이메일</span>
              <span className="text-gray-800">{(factory as any).users.email ?? '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-gray-500">연락처</span>
              <span className="text-gray-800">{(factory as any).users.phone ?? '-'}</span>
            </div>
          </div>
        </section>
      )}

      {/* 사업자등록증 */}
      {factory.biz_reg_url && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">사업자등록증</h2>
          {bizDocUrl ? (
            <a
              href={bizDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <span className="text-xl">📄</span>
              사업자등록증 열람 / 다운로드
            </a>
          ) : (
            <p className="text-sm text-gray-400">파일 URL 만료</p>
          )}
        </section>
      )}

      {/* 포트폴리오 */}
      {portfolioItems.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">포트폴리오 ({portfolioItems.length}건)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portfolioItems.map((p) => (
              <a
                key={p.id}
                href={p.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.signedUrl}
                  alt={p.description ?? '포트폴리오'}
                  className="aspect-square w-full rounded-xl object-cover group-hover:opacity-90"
                />
                {p.description && (
                  <p className="mt-1 truncate text-xs text-gray-500">{p.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 매칭 이력 */}
      {matches && matches.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">매칭 이력</h2>
          <div className="space-y-2">
            {(matches as any[]).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{m.quote_requests?.site_name}</p>
                  <p className="text-xs text-gray-500">{m.quote_requests?.company_name}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.status === 'confirmed'
                      ? 'bg-green-50 text-green-700'
                      : m.status === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {m.status === 'confirmed'
                    ? '수락'
                    : m.status === 'rejected'
                      ? '거절'
                      : m.status === 'cancelled'
                        ? '취소'
                        : '검토중'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
