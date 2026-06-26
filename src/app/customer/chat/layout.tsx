import { createClient } from '@/lib/supabase/server'
import ChatRoomList, { type ChatRoomListItem } from '@/components/chat/ChatRoomList'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRoomLabel(type: string, factoryName?: string) {
  if (type === 'customer_sofit') return '소핏 상담'
  if (type === 'customer_factory') return factoryName ? `${factoryName} 채팅` : '공장 직접 채팅'
  return type
}

async function getRooms(): Promise<ChatRoomListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) return []

  const { data: requests } = await supabase
    .from('quote_requests')
    .select('id, site_name')
    .eq('customer_id', customer.id)

  const requestIds = requests?.map((r) => r.id) ?? []
  const siteNameById = Object.fromEntries((requests ?? []).map((r) => [r.id, r.site_name]))
  if (requestIds.length === 0) return []

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, type, request_id, match_id, created_at')
    .in('request_id', requestIds)
    .in('type', ['customer_sofit', 'customer_factory'])
    .order('created_at', { ascending: false })
  if (!rooms || rooms.length === 0) return []

  // customer_factory 방의 공장명
  const factoryMatchIds = rooms
    .filter((r) => r.type === 'customer_factory' && r.match_id)
    .map((r) => r.match_id as string)
  const factoryNameByMatchId: Record<string, string> = {}
  if (factoryMatchIds.length > 0) {
    const { data: matchFactories } = await supabase
      .from('matches')
      .select('id, factories(company_name)')
      .in('id', factoryMatchIds)
    for (const m of matchFactories ?? []) {
      const f = m.factories as unknown as { company_name: string } | null
      if (f?.company_name) factoryNameByMatchId[m.id] = f.company_name
    }
  }

  // 마지막 메시지 + 미읽음
  const roomIds = rooms.map((r) => r.id)
  const { data: allMessages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_name, created_at, sender_id, read_at')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

  type MsgRow = NonNullable<typeof allMessages>[number]
  const lastMsgByRoom: Record<string, MsgRow> = {}
  const unreadByRoom: Record<string, number> = {}
  for (const msg of allMessages ?? []) {
    if (!lastMsgByRoom[msg.room_id]) lastMsgByRoom[msg.room_id] = msg
    if (msg.sender_id !== user.id && !msg.read_at) {
      unreadByRoom[msg.room_id] = (unreadByRoom[msg.room_id] ?? 0) + 1
    }
  }

  return rooms.map((room) => {
    const factoryName = room.match_id ? factoryNameByMatchId[room.match_id] : undefined
    const lastMsg = lastMsgByRoom[room.id]
    return {
      id: room.id,
      href: `/customer/chat/${room.id}`,
      name: getRoomLabel(room.type, factoryName),
      subtitle: siteNameById[room.request_id] ?? undefined,
      preview: lastMsg
        ? lastMsg.content ?? `📎 ${lastMsg.file_name ?? '첨부파일'}`
        : '대화를 시작하세요',
      time: lastMsg ? formatTime(lastMsg.created_at) : undefined,
      unread: unreadByRoom[room.id] ?? 0,
      avatar: room.type === 'customer_sofit' ? 'S' : '공',
    }
  })
}

export default async function CustomerChatLayout({ children }: { children: React.ReactNode }) {
  const rooms = await getRooms()

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface">
        <ChatHeaderBar>
          <h1 className="text-base font-semibold text-ink">채팅</h1>
        </ChatHeaderBar>
        <div className="flex-1 overflow-y-auto">
          <ChatRoomList rooms={rooms} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
