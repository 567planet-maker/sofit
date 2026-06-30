import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatRoom from '@/components/chat/ChatRoom'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import Avatar from '@/components/ui/Avatar'
import type { ChatMessageWithSender } from '@/types'

export default async function AdminChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // 채팅방 정보
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, type, quote_requests(id, site_name)')
    .eq('id', roomId)
    .single()
  if (!room) notFound()

  // 메시지 목록 (발신자 정보 포함)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select(
      'id, room_id, content, file_url, file_name, created_at, sender_id, read_at, users(id, name, role, avatar_url)',
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  const req = (room as any).quote_requests
  const isReadOnly = room.type === 'customer_factory'
  const participant = ((messages ?? []) as any[]).find((m) => m.sender_id !== user.id)
  const participantAvatar = (participant?.users?.avatar_url as string | null) ?? null
  const participantName = (participant?.users?.name as string | undefined) ?? req?.site_name

  return (
    <div className="flex h-screen flex-col">
      <ChatHeaderBar className="px-6">
        <Link href="/admin/chats" className="text-sm text-brand hover:underline">
          ← 목록
        </Link>
        <Avatar src={participantAvatar} name={participantName ?? req?.site_name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{req?.site_name ?? '(현장 정보 없음)'}</p>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="flex-shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
                읽기 전용 (고객↔공장)
              </span>
            )}
          </div>
        </div>
        {req?.id && (
          <Link
            href={`/admin/requests/${req.id}`}
            className="flex-shrink-0 text-sm text-brand hover:underline"
          >
            견적 상세 →
          </Link>
        )}
      </ChatHeaderBar>

      <div className="flex-1 overflow-hidden">
        <ChatRoom
          roomId={roomId}
          currentUserId={user.id}
          currentUserRole={userData?.role ?? 'admin'}
          initialMessages={(messages ?? []) as unknown as ChatMessageWithSender[]}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  )
}
