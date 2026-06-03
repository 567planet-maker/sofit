import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProgressPhoto } from '@/types'
import ProgressPhotoUploader from './ProgressPhotoUploader'
import { QUOTE_REQUEST_STATUS_LABELS } from '@/lib/constants/status'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function FactoryProjectsPage() {
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

  // 계약 완료 또는 시공 중인 매칭 조회
  const { data: matches } = await supabase
    .from('matches')
    .select(
      `
      id,
      quote_requests!inner(
        id, site_name, company_name, address, status,
        delivery_date, install_date, created_at
      )
    `,
    )
    .eq('factory_id', factory.id)
    .eq('status', 'confirmed')
    .in('quote_requests.status', ['contracted', 'in_progress', 'completed'])
    .order('created_at', { ascending: false })

  type MatchRow = {
    id: string
    quote_requests: {
      id: string
      site_name: string
      company_name: string
      address: string | null
      status: string
      delivery_date: string | null
      install_date: string | null
      created_at: string
    }
  }

  const typedMatches = (matches ?? []) as unknown as MatchRow[]

  // 각 프로젝트의 진행 사진 조회 + 서명 URL 생성
  const projectsWithPhotos = await Promise.all(
    typedMatches.map(async (match) => {
      const reqId = match.quote_requests.id

      // 채팅방 조회 (고객↔공장 직접 채팅)
      const { data: chatRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('request_id', reqId)
        .eq('match_id', match.id)
        .maybeSingle()

      // 진행 사진 조회
      const { data: photos = [] } = await supabase
        .from('progress_photos')
        .select('id, file_url, file_name, file_size, created_at')
        .eq('request_id', reqId)
        .eq('factory_id', factory.id)
        .order('created_at', { ascending: false })

      const photosWithUrls = await Promise.all(
        (photos as ProgressPhoto[]).map(async (p) => {
          const { data } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(p.file_url, 3600)
          return { ...p, signedUrl: data?.signedUrl ?? null }
        }),
      )

      return {
        match,
        chatRoom,
        photos: photosWithUrls,
      }
    }),
  )


  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">진행 프로젝트</h1>

      {projectsWithPhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">계약이 완료된 프로젝트가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-300">
            매칭 수락 후 고객이 계약을 확정하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {projectsWithPhotos.map(({ match, chatRoom, photos }) => {
            const req = match.quote_requests
            return (
              <section
                key={match.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                {/* 프로젝트 헤더 */}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{req.site_name}</h2>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                        {QUOTE_REQUEST_STATUS_LABELS[req.status as keyof typeof QUOTE_REQUEST_STATUS_LABELS] ?? req.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{req.company_name}</p>
                    {req.address && (
                      <p className="mt-0.5 text-xs text-gray-400">{req.address}</p>
                    )}
                    <div className="mt-1 flex gap-4">
                      {req.delivery_date && (
                        <p className="text-xs text-gray-400">
                          납품 희망: {formatDate(req.delivery_date)}
                        </p>
                      )}
                      {req.install_date && (
                        <p className="text-xs text-gray-400">
                          설치 희망: {formatDate(req.install_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-2">
                    <Link
                      href={`/factory/requests/${req.id}`}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      요청서 보기
                    </Link>
                    {chatRoom && (
                      <Link
                        href={`/factory/chat/${chatRoom.id}`}
                        className="rounded-xl border border-indigo-200 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                      >
                        고객과 채팅
                      </Link>
                    )}
                  </div>
                </div>

                {/* 진행 사진 */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-700">진행 사진</h3>
                  <ProgressPhotoUploader
                    requestId={req.id}
                    initialPhotos={photos}
                  />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
