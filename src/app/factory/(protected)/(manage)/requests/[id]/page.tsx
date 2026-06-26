import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RequestFile } from '@/types'
import MatchActions from './MatchActions'
import JoinActions from './JoinActions'
import QuoteForm from './QuoteForm'

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

  // 매칭이 있을 때만 견적서·채팅방 조회
  const QUOTE_FIELDS =
    'material_cost, labor_cost, delivery_cost, install_cost, demolition_cost, extra_cost, margin, delivery_days, note, status, version'

  const { data: draftQuote } = match
    ? await supabase
        .from('factory_quotes')
        .select(QUOTE_FIELDS)
        .eq('match_id', match.id)
        .eq('status', 'draft')
        .maybeSingle()
    : { data: null }

  const { data: submittedQuote } = match
    ? await supabase
        .from('factory_quotes')
        .select(QUOTE_FIELDS)
        .eq('match_id', match.id)
        .eq('is_latest', true)
        .eq('status', 'submitted')
        .maybeSingle()
    : { data: null }

  const existingQuote = draftQuote ?? submittedQuote

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
          <p className="mt-0.5 text-sm text-ink-muted">{req.company_name}</p>
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
          {/* 현장 정보 */}
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

          {/* 일정 */}
          {(req.delivery_date || req.install_date || req.needs_measurement) && (
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

      {/* ── 공장 견적서 작성/수정 (참여 후에만 표시) ──────────────── */}
      {match?.status === 'confirmed' && (
        <section className="rounded-card border border-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-ink">공장 견적서</h2>
            {chatRoom && (
              <Link
                href={`/factory/chat/${chatRoom.id}`}
                className="rounded-lg border border-brand-tint-strong px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-tint"
              >
                고객과 채팅 →
              </Link>
            )}
          </div>
          <QuoteForm matchId={match.id} existing={existingQuote} />
        </section>
      )}
    </div>
  )
}
