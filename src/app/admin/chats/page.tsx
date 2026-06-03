import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ROOM_TYPE_MAP: Record<string, { label: string; className: string }> = {
  customer_sofit: { label: '고객↔소핏', className: 'bg-indigo-50 text-indigo-700' },
  customer_factory: { label: '고객↔공장', className: 'bg-teal-50 text-teal-700' },
  factory_sofit: { label: '공장↔소핏', className: 'bg-purple-50 text-purple-700' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminChatsPage() {
  const supabase = await createClient()

  // 쿼리 1: 모든 채팅방 + 견적 요청 정보
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select(
      `
      id, type, created_at,
      quote_requests(site_name, company_name)
    `,
    )
    .order('created_at', { ascending: false })

  // 쿼리 2: 모든 방의 메시지를 한 번에 조회 후 JS에서 방별 최신 1건 추출
  // (PostgREST가 nested relation에 LIMIT 1을 지원하지 않으므로 2-query 방식 사용)
  const roomIds = (rooms ?? []).map((r) => r.id)
  const lastMsgByRoom = new Map<string, { room_id: string; content: string | null; created_at: string; users: { role: string } | null }>()

  if (roomIds.length > 0) {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('room_id, content, created_at, users(role)')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })

    for (const msg of messages ?? []) {
      if (!lastMsgByRoom.has(msg.room_id)) {
        lastMsgByRoom.set(msg.room_id, msg as any)
      }
    }
  }

  const roomsWithMessages = (rooms ?? []).map((room) => ({
    ...room,
    lastMsg: lastMsgByRoom.get(room.id) ?? null,
  }))

  // 미답변 우선 정렬 (마지막 메시지가 고객/공장 것인 경우)
  const sorted = roomsWithMessages.sort((a, b) => {
    const aIsAdmin = (a.lastMsg as any)?.users?.role === 'admin'
    const bIsAdmin = (b.lastMsg as any)?.users?.role === 'admin'
    if (!aIsAdmin && bIsAdmin) return -1
    if (aIsAdmin && !bIsAdmin) return 1
    const aTime = a.lastMsg?.created_at ?? a.created_at
    const bTime = b.lastMsg?.created_at ?? b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">채팅 통합 뷰</h1>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">채팅방이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {sorted.map((room, i) => {
            const req = (room as any).quote_requests
            const lastMsg = room.lastMsg as any
            const typeInfo = ROOM_TYPE_MAP[room.type] ?? { label: room.type, className: 'bg-gray-100 text-gray-600' }
            const isUnanswered =
              lastMsg && lastMsg.users?.role !== 'admin' && room.type === 'customer_sofit'

            return (
              <Link
                key={room.id}
                href={`/admin/chats/${room.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 ${
                  i > 0 ? 'border-t border-gray-100' : ''
                } ${isUnanswered ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.className}`}
                    >
                      {typeInfo.label}
                    </span>
                    {isUnanswered && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                        미답변
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-medium text-gray-900">
                    {req?.site_name ?? '(현장 정보 없음)'}
                  </p>
                  {req?.company_name && (
                    <p className="truncate text-xs text-gray-500">{req.company_name}</p>
                  )}
                  {lastMsg?.content && (
                    <p className="mt-1 truncate text-sm text-gray-400">{lastMsg.content}</p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  {lastMsg?.created_at && (
                    <p className="text-xs text-gray-400">{formatDate(lastMsg.created_at)}</p>
                  )}
                  <p className="mt-1 text-xs text-indigo-600">보기 →</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
