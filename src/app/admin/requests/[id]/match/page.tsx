import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus } from '@/types'
import MatchClient from './MatchClient'

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: requestId } = await params
  const supabase = await createClient()

  // 요청 기본 정보
  const { data: req } = await supabase
    .from('quote_requests')
    .select('id, site_name, company_name, status')
    .eq('id', requestId)
    .single()
  if (!req) notFound()

  // 기존 매칭 목록 (공장 정보 + 견적서 + 채팅방)
  const { data: rawMatches } = await supabase
    .from('matches')
    .select(
      `
      id, status, note, created_at,
      factories(id, company_name, location),
      factory_quotes(total_cost, delivery_days, status)
    `,
    )
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  // 채팅방 조회 (customer_factory 타입)
  const { data: chatRooms } = await supabase
    .from('chat_rooms')
    .select('id, match_id')
    .eq('request_id', requestId)
    .eq('type', 'customer_factory')

  const chatRoomMap: Record<string, string> = {}
  for (const room of chatRooms ?? []) {
    if (room.match_id) chatRoomMap[room.match_id] = room.id
  }

  const existingMatches = (rawMatches ?? []).map((m: any) => ({
    ...m,
    chatRoomId: chatRoomMap[m.id] ?? null,
  }))

  // 이미 배포된 공장 ID (cancelled 제외)
  const matchedFactoryIds = new Set(
    existingMatches.filter((m) => m.status !== 'cancelled').map((m: any) => m.factories?.id),
  )

  // 활성 공장 중 아직 배포 안 된 공장
  const { data: allActiveFactories } = await supabase
    .from('factories')
    .select('id, company_name, location, description, rating_avg')
    .eq('status', 'active')
    .order('company_name')

  const availableFactories = (allActiveFactories ?? []).filter(
    (f) => !matchedFactoryIds.has(f.id),
  )

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/admin/requests/${requestId}`}
          className="mb-2 block text-sm text-indigo-500 hover:underline"
        >
          ← {req.site_name}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">공장 매칭 관리</h1>
          <StatusBadge status={req.status as QuoteRequestStatus} />
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{req.company_name}</p>
      </div>

      <MatchClient
        requestId={requestId}
        availableFactories={availableFactories}
        existingMatches={existingMatches}
      />
    </div>
  )
}
