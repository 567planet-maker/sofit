import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProgressPhoto } from '@/types'
import ProgressPhotoUploader from './ProgressPhotoUploader'
import { Card, Badge, EmptyState } from '@/components/ui'
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
      const { data: photosData } = await supabase
        .from('progress_photos')
        .select('id, file_url, file_name, file_size, created_at')
        .eq('request_id', reqId)
        .eq('factory_id', factory.id)
        .order('created_at', { ascending: false })

      const photosWithUrls = await Promise.all(
        ((photosData ?? []) as ProgressPhoto[]).map(async (p) => {
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
    <div>

      {projectsWithPhotos.length === 0 ? (
        <EmptyState
          title="계약이 완료된 프로젝트가 없습니다."
          description="매칭 수락 후 고객이 계약을 확정하면 여기에 표시됩니다."
        />
      ) : (
        <div className="space-y-6">
          {projectsWithPhotos.map(({ match, chatRoom, photos }) => {
            const req = match.quote_requests
            return (
              <Card key={match.id} className="p-5">
                {/* 프로젝트 헤더 */}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-ink">{req.site_name}</h2>
                      <Badge tone="success">
                        {QUOTE_REQUEST_STATUS_LABELS[req.status as keyof typeof QUOTE_REQUEST_STATUS_LABELS] ?? req.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">{req.company_name}</p>
                    {req.address && (
                      <p className="mt-0.5 text-xs text-ink-subtle">{req.address}</p>
                    )}
                    <div className="mt-1 flex gap-4">
                      {req.delivery_date && (
                        <p className="text-xs text-ink-subtle">
                          납품 희망: {formatDate(req.delivery_date)}
                        </p>
                      )}
                      {req.install_date && (
                        <p className="text-xs text-ink-subtle">
                          설치 희망: {formatDate(req.install_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-2">
                    <Link
                      href={`/factory/requests/${req.id}`}
                      className="rounded-card border border-border px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-muted"
                    >
                      요청서 보기
                    </Link>
                    {chatRoom && (
                      <Link
                        href={`/factory/chat/${chatRoom.id}`}
                        className="rounded-card border border-brand-tint-strong px-3 py-1.5 text-xs text-brand hover:bg-brand-tint"
                      >
                        고객과 채팅
                      </Link>
                    )}
                  </div>
                </div>

                {/* 진행 사진 */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-ink">진행 사진</h3>
                  <ProgressPhotoUploader
                    requestId={req.id}
                    initialPhotos={photos}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
