import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import { Card, CardBody, CardHeader, CardTitle, buttonVariants } from '@/components/ui'
import type { QuoteRequestStatus, RequestFile, StatusLog, MatchStatus } from '@/types'
import StatusChanger from './StatusChanger'
import AdminNoteEditor from './AdminNoteEditor'
import { QUOTE_REQUEST_STATUS_LABELS } from '@/lib/constants/status'
import QuoteRequestView, { isNewSchemaRequest } from '@/components/quote/QuoteRequestView'
import CategoryItemsSection from '@/components/quote/CategoryItemsSection'
import AttachmentGallery from '@/components/quote/AttachmentGallery'

function getBucket(fileType: string) {
  return fileType === 'document' ? 'request-documents' : 'request-images'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Row({ label, value }: { label: string; value: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  const display =
    typeof value === 'boolean' ? (value ? '예' : '아니오') : String(value)
  return (
    <div className="flex gap-2 py-1.5 text-sm">
      <span className="w-24 flex-shrink-0 text-ink-subtle">{label}</span>
      <span className="font-medium text-ink">{display}</span>
    </div>
  )
}

const MATCH_STATUS_MAP: Record<MatchStatus, { label: string; className: string }> = {
  pending: { label: '검토중', className: 'bg-warning-tint text-warning' },
  confirmed: { label: '수락', className: 'bg-success-tint text-success' },
  rejected: { label: '거절', className: 'bg-danger-tint text-danger' },
  cancelled: { label: '취소', className: 'bg-surface-muted text-ink-muted' },
}


export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('quote_requests')
    .select('*, request_files(*), status_logs(*)')
    .eq('id', id)
    .single()
  if (!req) notFound()

  // 분야별 항목 (신규 다분야 요청)
  const { data: itemsData } = await supabase
    .from('quote_request_items')
    .select('category, details')
    .eq('request_id', id)
  const items = (itemsData ?? []) as Array<{ category: string; details: Record<string, unknown> }>
  const isNew = isNewSchemaRequest(req as Record<string, unknown>)

  // 매칭된 공장 목록 (견적서 포함)
  const { data: matches } = await supabase
    .from('matches')
    .select(
      `
      id, status, note, created_at,
      factories(id, company_name, location),
      factory_quotes(total_cost, delivery_days, status)
    `,
    )
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  // 파일 서명 URL
  const files: (RequestFile & { signedUrl: string | null })[] = await Promise.all(
    (req.request_files as RequestFile[]).map(async (f) => {
      const bucket = getBucket(f.file_type)
      const { data } = await supabase.storage.from(bucket).createSignedUrl(f.file_url, 3600)
      return { ...f, signedUrl: data?.signedUrl ?? null }
    }),
  )

  const imageFiles = files.filter((f) => f.file_type === 'image')
  const docFiles = files.filter((f) => f.file_type !== 'image')
  const statusLogs = (req.status_logs as StatusLog[]).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="mx-auto max-w-5xl p-7">
      {/* 뒤로 */}
      <Link href="/admin/requests" className="mb-3.5 inline-block text-sm text-ink-subtle hover:text-ink">
        ← 전체 요청 목록
      </Link>

      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{req.site_name}</h1>
          <StatusBadge status={req.status as QuoteRequestStatus} />
        </div>
        <Link
          href={`/admin/requests/${id}/match`}
          className={buttonVariants({ variant: 'primary', size: 'sm' })}
        >
          공장 매칭 관리 →
        </Link>
      </div>

      {/* 본문: 2-컬럼 (메인 + 사이드) */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* ── 메인 ── */}
        <div className="space-y-5">
          {/* 공통 정보 + 분야별 (신규 다분야 요청) */}
          <QuoteRequestView request={req as Record<string, unknown>} className="rounded-card border border-border bg-surface p-5 shadow-card" />
          <CategoryItemsSection items={items} className="rounded-card border border-border bg-surface p-5 shadow-card" />
          <AttachmentGallery requestId={id} className="rounded-card border border-border bg-surface p-5 shadow-card" />

          {/* 현장 정보 (레거시 요청) */}
          {!isNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">현장 정보</CardTitle>
              </CardHeader>
              <CardBody>
                <Row label="업체명" value={req.company_name} />
                <Row label="현장명" value={req.site_name} />
                <Row label="주소" value={req.address} />
                <Row label="현장 담당자" value={req.site_manager} />
                <Row label="연락처" value={req.contact} />
                <Row label="방문 가능 시간" value={req.available_time} />
                <Row label="업종" value={req.business_type} />
                <Row label="층수" value={req.floor} />
                <Row label="주차 가능" value={req.has_parking} />
                <Row label="엘리베이터" value={req.has_elevator} />
              </CardBody>
            </Card>
          )}

          {/* 제품 정보 */}
          {(req.sofa_type || req.sofa_count || req.cushion_type) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">제품 정보</CardTitle>
              </CardHeader>
              <CardBody>
                <Row label="쇼파 형태" value={req.sofa_type} />
                <Row label="수량" value={req.sofa_count ? `${req.sofa_count}개` : null} />
                <Row label="좌석 수" value={req.seat_count ? `${req.seat_count}인용` : null} />
                <Row label="등받이 높이" value={req.backrest_height} />
                <Row label="팔걸이" value={req.has_armrest} />
                <Row label="쿠션 타입" value={req.cushion_type} />
                <Row label="프레임 구조" value={req.frame_structure} />
                <Row label="방염" value={req.flame_retardant} />
                <Row label="방수" value={req.waterproof} />
              </CardBody>
            </Card>
          )}

          {/* 규격 */}
          {(req.total_length || req.total_width || req.total_height) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">규격</CardTitle>
              </CardHeader>
              <CardBody>
                <Row label="전체 길이" value={req.total_length ? `${req.total_length}mm` : null} />
                <Row label="전체 폭" value={req.total_width ? `${req.total_width}mm` : null} />
                <Row label="전체 높이" value={req.total_height ? `${req.total_height}mm` : null} />
                <Row label="좌면 높이" value={req.seat_height ? `${req.seat_height}mm` : null} />
                <Row label="좌면 깊이" value={req.seat_depth ? `${req.seat_depth}mm` : null} />
                <Row label="벽 길이" value={req.wall_length ? `${req.wall_length}mm` : null} />
                <Row label="코너 각도" value={req.corner_angle ? `${req.corner_angle}°` : null} />
              </CardBody>
            </Card>
          )}

          {/* 자재 */}
          {(req.fabric_type || req.inner_material || req.frame_material) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">자재 정보</CardTitle>
              </CardHeader>
              <CardBody>
                <Row label="원단 종류" value={req.fabric_type} />
                <Row label="내부 충전재" value={req.inner_material} />
                <Row label="프레임 재질" value={req.frame_material} />
                <Row label="색상" value={req.color_code} />
              </CardBody>
            </Card>
          )}

          {/* 일정 (레거시 요청) */}
          {!isNew && (req.delivery_date || req.install_date || req.needs_measurement) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">일정</CardTitle>
              </CardHeader>
              <CardBody>
                <Row label="실측 필요" value={req.needs_measurement} />
                <Row label="실측 희망일" value={req.measurement_date} />
                <Row label="제작 시작" value={req.production_start} />
                <Row label="제작 완료" value={req.production_end} />
                <Row label="납품 희망일" value={req.delivery_date} />
                <Row label="설치 희망일" value={req.install_date} />
              </CardBody>
            </Card>
          )}

          {/* 첨부 도면 · 사진 */}
          {(imageFiles.length > 0 || docFiles.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">첨부 도면 · 사진</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imageFiles.map((f) =>
                      f.signedUrl ? (
                        <a key={f.id} href={f.signedUrl} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.signedUrl}
                            alt={f.file_name ?? '사진'}
                            className="aspect-[4/3] w-full rounded-md border border-border object-cover hover:opacity-90"
                          />
                        </a>
                      ) : null,
                    )}
                  </div>
                )}
                {docFiles.length > 0 && (
                  <ul className="space-y-2">
                    {docFiles.map((f) =>
                      f.signedUrl ? (
                        <li key={f.id}>
                          <a
                            href={f.signedUrl}
                            download={f.file_name ?? undefined}
                            className="flex items-center gap-3 rounded-md border border-border bg-surface-muted p-3 hover:border-border-strong"
                          >
                            <span className="text-xl">📄</span>
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {f.file_name ?? '도면 파일'}
                              </p>
                              {f.file_size && (
                                <p className="text-xs text-ink-subtle">
                                  {(f.file_size / 1024 / 1024).toFixed(1)}MB
                                </p>
                              )}
                            </div>
                          </a>
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* ── 사이드 ── */}
        <div className="space-y-5">
          {/* 상태 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">상태 관리</CardTitle>
            </CardHeader>
            <CardBody>
              <StatusChanger requestId={id} currentStatus={req.status as QuoteRequestStatus} />
            </CardBody>
          </Card>

          {/* 상태 타임라인 */}
          {statusLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">상태 타임라인</CardTitle>
              </CardHeader>
              <CardBody>
                <ol className="space-y-3">
                  {statusLogs.map((log, i) => (
                    <li key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                            i === 0 ? 'bg-brand' : 'bg-border-strong'
                          }`}
                        />
                        {i < statusLogs.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-semibold text-ink">
                          {QUOTE_REQUEST_STATUS_LABELS[log.to_status as QuoteRequestStatus] ??
                            log.to_status}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-subtle">{formatDate(log.created_at)}</p>
                        {log.note && <p className="mt-0.5 text-xs text-ink-muted">{log.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}

          {/* 공장 매칭 현황 */}
          {matches && matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">공장 매칭 현황</CardTitle>
                <Link
                  href={`/admin/requests/${id}/match`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  관리 →
                </Link>
              </CardHeader>
              <CardBody className="space-y-2">
                {(matches as any[]).map((m) => {
                  const statusInfo = MATCH_STATUS_MAP[m.status as MatchStatus]
                  const quote = m.factory_quotes?.[0]
                  return (
                    <div
                      key={m.id}
                      className="rounded-md border border-border bg-surface-muted px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {m.factories?.company_name}
                        </p>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      {m.factories?.location && (
                        <p className="mt-0.5 text-xs text-ink-subtle">{m.factories.location}</p>
                      )}
                      {quote && quote.status === 'submitted' && (
                        <p className="mt-1 text-sm font-semibold text-brand">
                          {new Intl.NumberFormat('ko-KR').format(quote.total_cost)}원
                          {quote.delivery_days ? ` · ${quote.delivery_days}일` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          )}

          {/* 관리자 메모 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">관리자 메모 (비공개)</CardTitle>
            </CardHeader>
            <CardBody>
              <AdminNoteEditor requestId={id} initialNote={req.admin_note} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
