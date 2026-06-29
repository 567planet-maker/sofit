import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatRoomList, { type ChatRoomListItem } from '@/components/chat/ChatRoomList'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import UserChip from '@/components/account/UserChip'
import { getCurrentProfile } from '@/lib/auth/current-user'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

  // customer_factory 방의 공장명 + 공장 담당자 프로필 사진
  const factoryMatchIds = rooms
    .filter((r) => r.type === 'customer_factory' && r.match_id)
    .map((r) => r.match_id as string)
  const factoryByMatchId: Record<string, { name: string; avatarUrl: string | null }> = {}
  if (factoryMatchIds.length > 0) {
    const { data: matchFactories } = await supabase
      .from('matches')
      .select('id, factories(company_name, users(avatar_url))')
      .in('id', factoryMatchIds)
    for (const m of matchFactories ?? []) {
      const f = m.factories as any
      if (f?.company_name) {
        factoryByMatchId[m.id] = { name: f.company_name, avatarUrl: f.users?.avatar_url ?? null }
      }
    }
  }

  // 마지막 메시지 + 미읽음 + 상대(발신자) user_id
  const roomIds = rooms.map((r) => r.id)
  const { data: allMessages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_name, created_at, sender_id, read_at')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

  type MsgRow = NonNullable<typeof allMessages>[number]
  const lastMsgByRoom: Record<string, MsgRow> = {}
  const unreadByRoom: Record<string, number> = {}
  const counterpartyByRoom: Record<string, string> = {}
  for (const msg of allMessages ?? []) {
    if (!lastMsgByRoom[msg.room_id]) lastMsgByRoom[msg.room_id] = msg
    if (msg.sender_id !== user.id) {
      if (!counterpartyByRoom[msg.room_id]) counterpartyByRoom[msg.room_id] = msg.sender_id
      if (!msg.read_at) unreadByRoom[msg.room_id] = (unreadByRoom[msg.room_id] ?? 0) + 1
    }
  }

  // 상대 프로필(이름·사진) — users RLS(migration 010)로 채팅 상대만 조회 가능
  const counterpartyIds = [...new Set(Object.values(counterpartyByRoom))]
  const profileById: Record<string, { name: string | null; avatar_url: string | null }> = {}
  if (counterpartyIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', counterpartyIds)
    for (const p of profiles ?? []) {
      profileById[p.id] = { name: p.name as string | null, avatar_url: p.avatar_url as string | null }
    }
  }

  return rooms.map((room) => {
    const factory = room.match_id ? factoryByMatchId[room.match_id] : undefined
    const cpId = counterpartyByRoom[room.id]
    const cp = cpId ? profileById[cpId] : undefined
    const lastMsg = lastMsgByRoom[room.id]
    const name =
      room.type === 'customer_sofit'
        ? cp?.name ?? '소핏 상담'
        : factory?.name ?? cp?.name ?? '공장 직접 채팅'
    const avatarUrl =
      room.type === 'customer_sofit'
        ? cp?.avatar_url ?? null
        : factory?.avatarUrl ?? cp?.avatar_url ?? null
    return {
      id: room.id,
      href: `/customer/chat/${room.id}`,
      name,
      subtitle: siteNameById[room.request_id] ?? undefined,
      preview: lastMsg
        ? lastMsg.content ?? `📎 ${lastMsg.file_name ?? '첨부파일'}`
        : '대화를 시작하세요',
      time: lastMsg ? formatTime(lastMsg.created_at) : undefined,
      unread: unreadByRoom[room.id] ?? 0,
      avatar: room.type === 'customer_sofit' ? 'S' : '공',
      avatarUrl,
    }
  })
}

export default async function CustomerChatLayout({ children }: { children: React.ReactNode }) {
  const [rooms, profile] = await Promise.all([getRooms(), getCurrentProfile()])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface">
        <ChatHeaderBar>
          <h1 className="text-base font-semibold text-ink">채팅</h1>
        </ChatHeaderBar>
        <div className="flex-1 overflow-y-auto">
          <ChatRoomList rooms={rooms} />
        </div>
        {profile && (
          <Link
            href="/customer/me"
            className="border-t border-border p-3 transition-colors hover:bg-surface-muted"
          >
            <UserChip name={profile.name} avatarUrl={profile.avatarUrl} subtitle={profile.email} />
          </Link>
        )}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
