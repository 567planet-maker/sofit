import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import { buttonVariants } from '@/components/ui'
import type { QuoteRequestStatus, RequestFile, StatusLog } from '@/types'
import { QUOTE_REQUEST_STATUS_LABELS } from '@/lib/constants/status'
import QuoteRequestView, { isNewSchemaRequest } from '@/components/quote/QuoteRequestView'
import CategoryItemsSection from '@/components/quote/CategoryItemsSection'
import StatusStepper from '@/components/quote/StatusStepper'

// file_type → bucket 매핑
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
    <div className="flex gap-2 text-sm">
      <span className="w-32 flex-shrink-0 text-ink-subtle">{label}</span>
      <span className="font-medium text-ink">{display}</span>
    </div>
  )
}


export default async function CustomerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // 소유권 확인 포함 조회
  const { data: req } = await supabase
    .from('quote_requests')
    .select('*, request_files(*), status_logs(*)')
    .eq('id', id)
    .eq('customer_id', customer.id)
    .single()

  if (!req) notFound()

  // 분야별 항목 (신규 다분야 요청)
  const { data: itemsData } = await supabase
    .from('quote_request_items')
    .select('category, details')
    .eq('request_id', id)
  const items = (itemsData ?? []) as Array<{ category: string; details: Record<string, unknown> }>
  const isNew = isNewSchemaRequest(req as Record<string, unknown>)

  // customer_sofit 채팅방 조회
  const { data: chatRoom } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('request_id', id)
    .eq('type', 'customer_sofit')
    .single()

  // 파일 서명 URL 생성 (60분 유효)
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
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/customer/requests" className="mb-2 block text-sm text-ink-subtle hover:text-brand">
            ← 목록으로
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{req.site_name}</h1>
        </div>
        <StatusBadge status={req.status as QuoteRequestStatus} />
      </div>

      {/* 진행 단계 이정표 */}
      <StatusStepper status={req.status as QuoteRequestStatus} />

      {/* 상태 타임라인 */}
      {statusLogs.length > 0 && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">진행 이력</h2>
          <ol className="space-y-3">
            {statusLogs.map((log, i) => (
              <li key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      i === statusLogs.length - 1 ? 'bg-brand' : 'bg-border-strong'
                    }`}
                  />
                  {i < statusLogs.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-ink">
                    {QUOTE_REQUEST_STATUS_LABELS[log.to_status as QuoteRequestStatus] ?? log.to_status}
                  </p>
                  <p className="text-xs text-ink-subtle">{formatDate(log.created_at)}</p>
                  {log.note && <p className="mt-1 text-xs text-ink-muted">{log.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 내가 요청한 견적서 요약 */}
      {(req.sofa_type || req.sofa_count || req.fabric_type || req.delivery_date) && (
        <section className="rounded-card border border-brand-tint-strong bg-brand-tint/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">
            내가 요청한 견적서
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
            {req.sofa_type && (
              <span>
                <span className="text-ink-subtle">형태</span> {req.sofa_type}
              </span>
            )}
            {req.sofa_count && (
              <span>
                <span className="text-ink-subtle">수량</span> {req.sofa_count}개
              </span>
            )}
            {req.seat_count && (
              <span>
                <span className="text-ink-subtle">좌석</span> {req.seat_count}인용
              </span>
            )}
            {req.fabric_type && (
              <span>
                <span className="text-ink-subtle">원단</span> {req.fabric_type}
              </span>
            )}
            {req.color_code && (
              <span>
                <span className="text-ink-subtle">색상</span> {req.color_code}
              </span>
            )}
            {req.delivery_date && (
              <span>
                <span className="text-ink-subtle">납품 희망</span> {req.delivery_date}
              </span>
            )}
          </div>
        </section>
      )}

      {/* 견적서 보기 / 채팅 버튼 */}
      <div className="flex gap-3">
        {!['submitted', 'reviewing'].includes(req.status) && (
          <Link
            href={`/customer/requests/${id}/quotes`}
            className={buttonVariants({
              variant: req.status === 'quote_arrived' ? 'primary' : 'secondary',
              size: 'sm',
            })}
          >
            {req.status === 'contracted' ? '계약 견적서 보기' : '견적서 확인'}
          </Link>
        )}
        {chatRoom && (
          <Link
            href={`/customer/chat/${chatRoom.id}`}
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            소핏 담당자와 채팅
          </Link>
        )}
      </div>

      {/* 공통 정보 + 분야별 (신규 다분야 요청) */}
      <QuoteRequestView request={req as Record<string, unknown>} className="rounded-card border border-border bg-surface p-5 shadow-card" />
      <CategoryItemsSection items={items} className="rounded-card border border-border bg-surface p-5 shadow-card" />

      {/* 현장 정보 (레거시 요청) */}
      {!isNew && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-medium text-ink">현장 정보</h2>
          <div className="space-y-2">
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
          </div>
        </section>
      )}

      {/* 제품 정보 */}
      {(req.sofa_type ||
        req.sofa_count ||
        req.seat_count ||
        req.backrest_height ||
        req.cushion_type ||
        req.frame_structure) && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">제품 정보</h2>
          <div className="space-y-2">
            <Row label="쇼파 형태" value={req.sofa_type} />
            <Row label="수량" value={req.sofa_count ? `${req.sofa_count}개` : null} />
            <Row label="좌석 수" value={req.seat_count ? `${req.seat_count}인용` : null} />
            <Row label="등받이 높이" value={req.backrest_height} />
            <Row label="팔걸이" value={req.has_armrest} />
            <Row label="쿠션 타입" value={req.cushion_type} />
            <Row label="프레임 구조" value={req.frame_structure} />
            <Row label="방염" value={req.flame_retardant} />
            <Row label="방수" value={req.waterproof} />
          </div>
        </section>
      )}

      {/* 규격 */}
      {(req.total_length || req.total_width || req.total_height) && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">규격</h2>
          <div className="space-y-2">
            <Row label="전체 길이" value={req.total_length ? `${req.total_length}mm` : null} />
            <Row label="전체 폭" value={req.total_width ? `${req.total_width}mm` : null} />
            <Row label="전체 높이" value={req.total_height ? `${req.total_height}mm` : null} />
            <Row label="좌면 높이" value={req.seat_height ? `${req.seat_height}mm` : null} />
            <Row label="좌면 깊이" value={req.seat_depth ? `${req.seat_depth}mm` : null} />
            <Row label="벽 길이" value={req.wall_length ? `${req.wall_length}mm` : null} />
            <Row label="코너 각도" value={req.corner_angle ? `${req.corner_angle}°` : null} />
          </div>
        </section>
      )}

      {/* 자재 */}
      {(req.fabric_type || req.inner_material || req.frame_material || req.color_code) && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">자재 정보</h2>
          <div className="space-y-2">
            <Row label="원단 종류" value={req.fabric_type} />
            <Row label="내부 충전재" value={req.inner_material} />
            <Row label="프레임 재질" value={req.frame_material} />
            <Row label="색상" value={req.color_code} />
          </div>
        </section>
      )}

      {/* 일정 */}
      {(req.delivery_date || req.install_date || req.production_start) && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">일정</h2>
          <div className="space-y-2">
            <Row label="실측 필요" value={req.needs_measurement} />
            <Row label="실측 희망일" value={req.measurement_date} />
            <Row label="제작 시작" value={req.production_start} />
            <Row label="제작 완료" value={req.production_end} />
            <Row label="납품 희망일" value={req.delivery_date} />
            <Row label="설치 희망일" value={req.install_date} />
          </div>
        </section>
      )}

      {/* 이미지 갤러리 */}
      {imageFiles.length > 0 && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">현장 사진</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imageFiles.map((f) =>
              f.signedUrl ? (
                <a key={f.id} href={f.signedUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={f.signedUrl}
                    alt={f.file_name ?? '사진'}
                    className="aspect-square w-full rounded-card object-cover hover:opacity-90"
                  />
                </a>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* 도면 */}
      {docFiles.length > 0 && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">도면 파일</h2>
          <ul className="space-y-2">
            {docFiles.map((f) => (
              <li key={f.id}>
                {f.signedUrl ? (
                  <a
                    href={f.signedUrl}
                    download={f.file_name ?? undefined}
                    className="flex items-center gap-3 rounded-control border border-border bg-surface-muted p-3 transition-colors hover:bg-border/60"
                  >
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-ink">{f.file_name ?? '도면 파일'}</p>
                      {f.file_size && (
                        <p className="text-xs text-ink-subtle">
                          {(f.file_size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      )}
                    </div>
                  </a>
                ) : (
                  <p className="text-sm text-ink-subtle">{f.file_name ?? '파일'} (URL 만료)</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
