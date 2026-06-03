import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus, RequestFile, StatusLog, MatchStatus } from '@/types'
import StatusChanger from './StatusChanger'
import AdminNoteEditor from './AdminNoteEditor'
import { QUOTE_REQUEST_STATUS_LABELS } from '@/lib/constants/status'

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
      <span className="w-32 flex-shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{display}</span>
    </div>
  )
}

const MATCH_STATUS_MAP: Record<MatchStatus, { label: string; className: string }> = {
  pending: { label: '검토중', className: 'bg-yellow-50 text-yellow-700' },
  confirmed: { label: '수락', className: 'bg-green-50 text-green-700' },
  rejected: { label: '거절', className: 'bg-red-50 text-red-600' },
  cancelled: { label: '취소', className: 'bg-gray-100 text-gray-500' },
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
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/requests" className="mb-2 block text-sm text-indigo-500 hover:underline">
            ← 전체 요청 목록
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{req.site_name}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {req.company_name} · 접수 {formatDate(req.created_at)}
          </p>
        </div>
        <StatusBadge status={req.status as QuoteRequestStatus} />
      </div>

      {/* 상태 변경 */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800">상태 관리</h2>
        <StatusChanger requestId={id} currentStatus={req.status as QuoteRequestStatus} />
        <div className="mt-4">
          <Link
            href={`/admin/requests/${id}/match`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            공장 매칭 관리 →
          </Link>
        </div>
      </section>

      {/* 관리자 메모 */}
      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-800">관리자 메모 (비공개)</h2>
        <AdminNoteEditor requestId={id} initialNote={req.admin_note} />
      </section>

      {/* 매칭 현황 */}
      {matches && matches.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">공장 매칭 현황</h2>
            <Link
              href={`/admin/requests/${id}/match`}
              className="text-sm text-indigo-600 hover:underline"
            >
              매칭 관리 →
            </Link>
          </div>
          <div className="space-y-2">
            {(matches as any[]).map((m) => {
              const statusInfo = MATCH_STATUS_MAP[m.status as MatchStatus]
              const quote = m.factory_quotes?.[0]
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{m.factories?.company_name}</p>
                    {m.factories?.location && (
                      <p className="text-xs text-gray-500">{m.factories.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {quote && quote.status === 'submitted' && (
                      <span className="text-sm font-semibold text-indigo-700">
                        {new Intl.NumberFormat('ko-KR').format(quote.total_cost)}원
                        {quote.delivery_days ? ` · ${quote.delivery_days}일` : ''}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 진행 이력 */}
      {statusLogs.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">진행 이력</h2>
          <ol className="space-y-3">
            {statusLogs.map((log, i) => (
              <li key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      i === statusLogs.length - 1 ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                  {i < statusLogs.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-gray-800">
                    {QUOTE_REQUEST_STATUS_LABELS[log.to_status as QuoteRequestStatus] ?? log.to_status}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(log.created_at)}</p>
                  {log.note && <p className="mt-0.5 text-xs text-gray-500">{log.note}</p>}
                </div>
              </li>
            ))}
          </ol>
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
      {(req.sofa_type || req.sofa_count || req.cushion_type) && (
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
