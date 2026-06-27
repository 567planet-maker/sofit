import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatRoomList, { type ChatRoomListItem } from '@/components/chat/ChatRoomList'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import SidebarNav from '@/components/common/SidebarNav'
import UserChip from '@/components/account/UserChip'
import { getCurrentProfile } from '@/lib/auth/current-user'
import { FACTORY_MANAGE_NAV } from '../manageNav'

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

  const { data: factory } = await supabase
    .from('factories')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!factory) return []

  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('factory_id', factory.id)
    .eq('status', 'confirmed')
  const matchIds = matches?.map((m) => m.id) ?? []
  if (matchIds.length === 0) return []

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select(
      'id, type, request_id, match_id, created_at, quote_requests(id, site_name, customers(users(name, avatar_url)))',
    )
    .in('match_id', matchIds)
    .eq('type', 'customer_factory')
    .order('created_at', { ascending: false })
  if (!rooms || rooms.length === 0) return []

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
    const req = (room as any).quote_requests
    const customerUser = req?.customers?.users
    const lastMsg = lastMsgByRoom[room.id]
    return {
      id: room.id,
      href: `/factory/chat/${room.id}`,
      name: customerUser?.name ?? '고객 직접 채팅',
      subtitle: req?.site_name ?? undefined,
      preview: lastMsg
        ? lastMsg.content ?? `📎 ${lastMsg.file_name ?? '첨부파일'}`
        : '대화를 시작하세요',
      time: lastMsg ? formatTime(lastMsg.created_at) : undefined,
      unread: unreadByRoom[room.id] ?? 0,
      avatar: '고',
      avatarUrl: customerUser?.avatar_url ?? null,
    }
  })
}

export default async function FactoryChatLayout({ children }: { children: React.ReactNode }) {
  const [rooms, profile] = await Promise.all([getRooms(), getCurrentProfile()])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* 공장 관리 사이드바 (채팅에서도 유지) */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <ChatHeaderBar>
          <h2 className="text-base font-semibold text-ink">공장 관리</h2>
        </ChatHeaderBar>
        <div className="px-3 py-3">
          <SidebarNav items={FACTORY_MANAGE_NAV} />
        </div>
      </aside>

      {/* 채팅방 목록 */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface">
        <ChatHeaderBar>
          <h1 className="text-base font-semibold text-ink">채팅</h1>
        </ChatHeaderBar>
        <div className="flex-1 overflow-y-auto">
          <ChatRoomList rooms={rooms} />
        </div>
        {profile && (
          <Link
            href="/factory/me"
            className="border-t border-border p-3 transition-colors hover:bg-surface-muted"
          >
            <UserChip name={profile.name} avatarUrl={profile.avatarUrl} subtitle={profile.email} />
          </Link>
        )}
      </aside>

      {/* 대화 내용 */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
