import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FactoryStatus } from '@/types'
import FactoryActions from './FactoryActions'

const STATUS_MAP: Record<FactoryStatus, { label: string; className: string }> = {
  pending: { label: '승인 대기', className: 'bg-warning-tint text-warning' },
  active: { label: '활성', className: 'bg-success-tint text-success' },
  suspended: { label: '정지', className: 'bg-surface-muted text-ink-muted' },
  rejected: { label: '반려', className: 'bg-danger-tint text-danger' },
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
    .select('id, status, created_at, quote_requests(site_name)')
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
        <Link href="/admin/factories" className="mb-2 block text-sm text-brand hover:underline">
          ← 공장 목록
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">{factory.company_name}</h1>
            {factory.location && (
              <p className="mt-0.5 text-sm text-ink-muted">{factory.location}</p>
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
      <section className="rounded-card border border-border bg-white p-5 shadow-card">
        <h2 className="mb-4 font-medium text-ink">심사 처리</h2>
        <FactoryActions factoryId={factoryId} currentStatus={factory.status as FactoryStatus} />
      </section>

      {/* 기본 정보 */}
      <section className="rounded-card border border-border bg-white p-5 shadow-card">
        <h2 className="mb-4 font-medium text-ink">기본 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-28 flex-shrink-0 text-ink-muted">업체명</span>
            <span className="font-medium text-ink">{factory.company_name}</span>
          </div>
          {factory.location && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">위치</span>
              <span className="font-medium text-ink">{factory.location}</span>
            </div>
          )}
          {factory.description && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">소개</span>
              <span className="text-ink">{factory.description}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-28 flex-shrink-0 text-ink-muted">등록일</span>
            <span className="text-ink">{formatDate(factory.created_at)}</span>
          </div>
          {factory.rating_avg > 0 && (
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">평점</span>
              <span className="text-warning">★ {Number(factory.rating_avg).toFixed(1)}</span>
            </div>
          )}
        </div>
      </section>

      {/* 대표자 정보 */}
      {(factory as any).users && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <h2 className="mb-4 font-medium text-ink">계정 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">이름</span>
              <span className="text-ink">{(factory as any).users.name ?? '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">이메일</span>
              <span className="text-ink">{(factory as any).users.email ?? '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-28 flex-shrink-0 text-ink-muted">연락처</span>
              <span className="text-ink">{(factory as any).users.phone ?? '-'}</span>
            </div>
          </div>
        </section>
      )}

      {/* 사업자등록증 */}
      {factory.biz_reg_url && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <h2 className="mb-3 font-medium text-ink">사업자등록증</h2>
          {bizDocUrl ? (
            <a
              href={bizDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-card border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              <span className="text-xl">📄</span>
              사업자등록증 열람 / 다운로드
            </a>
          ) : (
            <p className="text-sm text-ink-subtle">파일 URL 만료</p>
          )}
        </section>
      )}

      {/* 포트폴리오 */}
      {portfolioItems.length > 0 && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <h2 className="mb-4 font-medium text-ink">포트폴리오 ({portfolioItems.length}건)</h2>
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
                  className="aspect-square w-full rounded-card object-cover group-hover:opacity-90"
                />
                {p.description && (
                  <p className="mt-1 truncate text-xs text-ink-muted">{p.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 매칭 이력 */}
      {matches && matches.length > 0 && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <h2 className="mb-4 font-medium text-ink">매칭 이력</h2>
          <div className="space-y-2">
            {(matches as any[]).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-card bg-surface-muted px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{m.quote_requests?.site_name}</p>
                  <p className="text-xs text-ink-muted">{m.quote_requests?.company_name}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.status === 'confirmed'
                      ? 'bg-success-tint text-success'
                      : m.status === 'rejected'
                        ? 'bg-danger-tint text-danger'
                        : 'bg-surface-muted text-ink-muted'
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
