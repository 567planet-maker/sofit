import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatRoom from '@/components/chat/ChatRoom'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import type { ChatMessageWithSender } from '@/types'

export default async function FactoryChatRoomPage({
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
    .select('role, name')
    .eq('id', user.id)
    .single()

  // 채팅방 정보 (RLS가 접근 권한 확인)
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, type, request_id, match_id, quote_requests(id, site_name, company_name)')
    .eq('id', roomId)
    .single()
  if (!room) notFound()

  // customer_factory 방만 허용
  if (room.type !== 'customer_factory') notFound()

  const req = (room as any).quote_requests

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_url, file_name, created_at, sender_id, read_at, users(id, name, role, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <ChatHeaderBar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">고객 직접 채팅</p>
          <p className="truncate text-xs text-ink-muted">
            {req?.site_name} · {req?.company_name}
          </p>
        </div>
        {req?.id && (
          <Link
            href={`/factory/requests/${req.id}`}
            className="flex-shrink-0 text-xs text-brand hover:underline"
          >
            견적 보기 →
          </Link>
        )}
      </ChatHeaderBar>

      <div className="flex-1 overflow-hidden">
        <ChatRoom
          roomId={roomId}
          currentUserId={user.id}
          currentUserRole={userData?.role ?? 'factory'}
          initialMessages={(messages ?? []) as unknown as ChatMessageWithSender[]}
          isReadOnly={false}
        />
      </div>
    </div>
  )
}
