import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RequestFile } from '@/types'
import MatchActions from './MatchActions'
import QuoteForm from './QuoteForm'

function Row({ label, value }: { label: string; value: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  const display =
    typeof value === 'boolean' ? (value ? '예' : '아니오') : String(value)
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 flex-shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{display}</span>
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

  // 매칭 확인 (이 공장이 이 요청에 매칭됐는지)
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, note')
    .eq('factory_id', factory.id)
    .eq('request_id', requestId)
    .single()
  if (!match) notFound()

  // 견적 요청 상세 (파일 포함)
  const { data: req } = await supabase
    .from('quote_requests')
    .select('*, request_files(*)')
    .eq('id', requestId)
    .single()
  if (!req) notFound()

  // 기존 견적서 조회
  const { data: existingQuote } = await supabase
    .from('factory_quotes')
    .select(
      'material_cost, labor_cost, delivery_cost, install_cost, demolition_cost, extra_cost, margin, delivery_days, note, status',
    )
    .eq('match_id', match.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
            className="mb-2 block text-sm text-indigo-500 hover:underline"
          >
            ← 매칭 요청 목록
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{req.site_name}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{req.company_name}</p>
        </div>
      </div>

      {/* 수락/거절 액션 */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">매칭 처리</h2>
        <MatchActions matchId={match.id} matchStatus={match.status} />
        {match.note && match.status === 'rejected' && (
          <p className="mt-3 text-sm text-gray-500">거절 사유: {match.note}</p>
        )}
      </section>

      {/* 견적서 작성 (수락 후에만 표시) */}
      {match.status === 'confirmed' && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">견적서 작성</h2>
          <QuoteForm matchId={match.id} existing={existingQuote} />
        </section>
      )}

      {/* 현장 정보 */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">현장 정보</h2>
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

      {/* 제품 정보 */}
      {(req.sofa_type || req.sofa_count || req.seat_count || req.cushion_type) && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">제품 정보</h2>
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
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">규격</h2>
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
      {(req.fabric_type || req.inner_material || req.frame_material) && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">자재 정보</h2>
          <div className="space-y-2">
            <Row label="원단 종류" value={req.fabric_type} />
            <Row label="내부 충전재" value={req.inner_material} />
            <Row label="프레임 재질" value={req.frame_material} />
            <Row label="색상" value={req.color_code} />
          </div>
        </section>
      )}

      {/* 일정 */}
      {(req.delivery_date || req.install_date || req.needs_measurement) && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">일정</h2>
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

      {/* 현장 사진 */}
      {imageFiles.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">현장 사진</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imageFiles.map((f) =>
              f.signedUrl ? (
                <a key={f.id} href={f.signedUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.signedUrl}
                    alt={f.file_name ?? '사진'}
                    className="aspect-square w-full rounded-xl object-cover hover:opacity-90"
                  />
                </a>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* 도면 */}
      {docFiles.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">도면 파일</h2>
          <ul className="space-y-2">
            {docFiles.map((f) =>
              f.signedUrl ? (
                <li key={f.id}>
                  <a
                    href={f.signedUrl}
                    download={f.file_name ?? undefined}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100"
                  >
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {f.file_name ?? '도면 파일'}
                      </p>
                      {f.file_size && (
                        <p className="text-xs text-gray-400">
                          {(f.file_size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      )}
                    </div>
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}
    </div>
  )
}
