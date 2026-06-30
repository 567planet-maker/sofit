import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RequestFile } from '@/types'
import MatchActions from './MatchActions'
import JoinActions from './JoinActions'
import QuoteForm from './QuoteForm'
import QuoteRequestView, { isNewSchemaRequest } from '@/components/quote/QuoteRequestView'
import CategoryItemsSection from '@/components/quote/CategoryItemsSection'
import AttachmentGallery from '@/components/quote/AttachmentGallery'
import ClarificationSummary from '@/components/quote/ClarificationSummary'
import { CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'

function Row({ label, value }: { label: string; value: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  const display =
    typeof value === 'boolean' ? (value ? '예' : '아니오') : String(value)
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 flex-shrink-0 text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{display}</span>
    </div>
  )
}

function getBucket(fileType: string) {
  return fileType === 'document' ? 'request-documents' : 'request-images'
}

export default async function FactoryRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: requestId } = await params
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

  // 매칭 확인 (없어도 진행 가능 — 신규 요청 조회 후 참여 가능)
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, note')
    .eq('factory_id', factory.id)
    .eq('request_id', requestId)
    .maybeSingle()

  // 견적 요청 상세 (파일 포함)
  const { data: req } = await supabase
    .from('quote_requests')
    .select('*, request_files(*)')
    .eq('id', requestId)
    .single()
  if (!req) notFound()

  // 분야별 항목 (신규 다분야 요청)
  const { data: itemsData } = await supabase
    .from('quote_request_items')
    .select('id, category, details')
    .eq('request_id', requestId)
  const items = (itemsData ?? []) as Array<{
    id: string
    category: string
    details: Record<string, unknown>
  }>
  const isNew = isNewSchemaRequest(req as Record<string, unknown>)

  // 이 공장의 전문 분야 → 요청 item 중 시공 가능한 것만 견적 대상
  const { data: myCats } = await supabase
    .from('factory_categories')
    .select('category')
    .eq('factory_id', factory.id)
  const myCategories = new Set((myCats ?? []).map((c) => c.category as string))
  const serviceableItems = items.filter((it) => myCategories.has(it.category))

  // 매칭 있을 때만, 시공 가능한 item별 기존 견적(draft 우선, 없으면 최신 submitted) 조회
  const QUOTE_FIELDS =
    'id, item_id, material_cost, labor_cost, delivery_cost, install_cost, demolition_cost, extra_cost, margin, delivery_days, note, status, version'

  type FactoryQuoteRow = {
    id: string
    item_id: string
    status: string
    version: number
    material_cost: number
    labor_cost: number
    delivery_cost: number
    install_cost: number
    demolition_cost: number
    extra_cost: number
    margin: number
    delivery_days: number | null
    note: string | null
  }

  const itemIds = serviceableItems.map((i) => i.id)
  const { data: myQuotesData } =
    match && itemIds.length > 0
      ? await supabase
          .from('factory_quotes')
          .select(QUOTE_FIELDS)
          .eq('match_id', match.id)
          .in('item_id', itemIds)
          .in('status', ['draft', 'submitted'])
      : { data: null }

  const quotesByItem = new Map<string, { draft?: FactoryQuoteRow; submitted?: FactoryQuoteRow }>()
  for (const q of (myQuotesData ?? []) as FactoryQuoteRow[]) {
    const slot = quotesByItem.get(q.item_id) ?? {}
    if (q.status === 'draft') slot.draft = q
    else if (q.status === 'submitted') slot.submitted = q
    quotesByItem.set(q.item_id, slot)
  }
  const existingQuoteFor = (id: string): FactoryQuoteRow | null => {
    const slot = quotesByItem.get(id)
    return slot?.draft ?? slot?.submitted ?? null
  }

  const { data: chatRoom } = match
    ? await supabase
        .from('chat_rooms')
        .select('id')
        .eq('match_id', match.id)
        .eq('type', 'customer_factory')
        .maybeSingle()
    : { data: null }

  // 파일 서명 URL 생성
  const files: (RequestFile & { signedUrl: string | null })[] = await Promise.all(
    (req.request_files as RequestFile[]).map(async (f) => {
      const bucket = getBucket(f.file_type)
      const { data } = await supabase.storage.from(bucket).createSignedUrl(f.file_url, 3600)
      return { ...f, signedUrl: data?.signedUrl ?? null }
    }),
  )

  const imageFiles = files.filter((f) => f.file_type === 'image')
  const docFiles = files.filter((f) => f.file_type !== 'image')

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/factory/requests"
            className="mb-2 block text-sm text-brand hover:underline"
          >
            ← 매칭 요청 목록
          </Link>
          <h1 className="text-xl font-semibold text-ink">{req.site_name}</h1>
        </div>
      </div>

      {/* 매칭 액션 */}
      <section className="rounded-card border border-border bg-white p-5 shadow-card">
        <h2 className="mb-4 font-medium text-ink">
          {match ? '매칭 상태' : '신규 견적 요청'}
        </h2>
        {match ? (
          <>
            <MatchActions matchId={match.id} matchStatus={match.status} />
            {match.note && match.status === 'rejected' && (
              <p className="mt-3 text-sm text-ink-muted">거절 사유: {match.note}</p>
            )}
          </>
        ) : (
          <JoinActions requestId={requestId} />
        )}
      </section>

      {/* ── 고객 견적서 ────────────────────────────────────────── */}
      <section className="rounded-card border border-brand-tint-strong bg-white p-5 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <h2 className="font-medium text-ink">고객 견적서</h2>
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs text-brand">
            고객이 요청한 내용
          </span>
        </div>

        <div className="space-y-5">
          {/* 공통 정보 + 분야별 (신규 다분야 요청) */}
          {isNew && (
            <>
              <QuoteRequestView request={req as Record<string, unknown>} />
              <ClarificationSummary items={items} className="border-t border-warning/30 pt-4" />
              <CategoryItemsSection items={items} className="border-t border-border pt-4" />
              <AttachmentGallery requestId={requestId} className="border-t border-border pt-4" />
            </>
          )}

          {/* 현장 정보 (레거시 요청) */}
          {!isNew && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                현장 정보
              </h3>
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
            </div>
          )}

          {/* 제품 정보 */}
          {(req.sofa_type || req.sofa_count || req.seat_count || req.cushion_type) && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                제품 정보
              </h3>
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
            </div>
          )}

          {/* 규격 */}
          {(req.total_length || req.total_width || req.total_height) && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                규격
              </h3>
              <div className="space-y-2">
                <Row label="전체 길이" value={req.total_length ? `${req.total_length}mm` : null} />
                <Row label="전체 폭" value={req.total_width ? `${req.total_width}mm` : null} />
                <Row label="전체 높이" value={req.total_height ? `${req.total_height}mm` : null} />
                <Row label="좌면 높이" value={req.seat_height ? `${req.seat_height}mm` : null} />
                <Row label="좌면 깊이" value={req.seat_depth ? `${req.seat_depth}mm` : null} />
                <Row label="벽 길이" value={req.wall_length ? `${req.wall_length}mm` : null} />
                <Row label="코너 각도" value={req.corner_angle ? `${req.corner_angle}°` : null} />
              </div>
            </div>
          )}

          {/* 자재 */}
          {(req.fabric_type || req.inner_material || req.frame_material) && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                자재 정보
              </h3>
              <div className="space-y-2">
                <Row label="원단 종류" value={req.fabric_type} />
                <Row label="내부 충전재" value={req.inner_material} />
                <Row label="프레임 재질" value={req.frame_material} />
                <Row label="색상" value={req.color_code} />
              </div>
            </div>
          )}

          {/* 일정 (레거시 요청) */}
          {!isNew && (req.delivery_date || req.install_date || req.needs_measurement) && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                일정
              </h3>
              <div className="space-y-2">
                <Row label="실측 필요" value={req.needs_measurement} />
                <Row label="실측 희망일" value={req.measurement_date} />
                <Row label="제작 시작" value={req.production_start} />
                <Row label="제작 완료" value={req.production_end} />
                <Row label="납품 희망일" value={req.delivery_date} />
                <Row label="설치 희망일" value={req.install_date} />
              </div>
            </div>
          )}

          {/* 현장 사진 */}
          {imageFiles.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                현장 사진
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageFiles.map((f) =>
                  f.signedUrl ? (
                    <a key={f.id} href={f.signedUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.signedUrl}
                        alt={f.file_name ?? '사진'}
                        className="aspect-square w-full rounded-card object-cover hover:opacity-90"
                      />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* 도면 */}
          {docFiles.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                도면 파일
              </h3>
              <ul className="space-y-2">
                {docFiles.map((f) =>
                  f.signedUrl ? (
                    <li key={f.id}>
                      <a
                        href={f.signedUrl}
                        download={f.file_name ?? undefined}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3 hover:bg-surface-muted"
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
            </div>
          )}
        </div>
      </section>

      {/* ── 공장 견적서 작성/수정 (참여 후, 분야별) ──────────────── */}
      {match?.status === 'confirmed' && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-ink">공장 견적서 (분야별)</h2>
            {chatRoom && (
              <Link
                href={`/factory/chat/${chatRoom.id}`}
                className="rounded-lg border border-brand-tint-strong px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-tint"
              >
                고객과 채팅 →
              </Link>
            )}
          </div>

          {serviceableItems.length === 0 ? (
            <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted">
              이 요청에는 귀사의 전문 분야가 없습니다. 전문 분야는{' '}
              <Link href="/factory/categories" className="font-medium text-brand hover:underline">
                전문 분야 설정
              </Link>
              에서 추가할 수 있습니다.
            </p>
          ) : (
            <div className="space-y-8">
              {serviceableItems.map((it) => (
                <div key={it.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-brand">
                      {CATEGORY_LABELS[it.category as CategoryKey] ?? it.category}
                    </span>
                    <span className="text-xs text-ink-subtle">분야 견적서</span>
                  </div>
                  <QuoteForm matchId={match.id} itemId={it.id} existing={existingQuoteFor(it.id)} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
