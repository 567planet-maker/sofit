import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatRoom from '@/components/chat/ChatRoom'
import type { ChatMessageWithSender } from '@/types'

const ROOM_TYPE_LABEL: Record<string, string> = {
  customer_sofit: '소핏 상담',
  customer_factory: '공장 직접 채팅',
}

export default async function CustomerChatRoomPage({
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
    .select('id, type, request_id, quote_requests(id, site_name, company_name)')
    .eq('id', roomId)
    .single()
  if (!room) notFound()

  // 이 고객의 채팅방인지 확인
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) notFound()

  const req = (room as any).quote_requests

  // 메시지 목록
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_url, file_name, created_at, sender_id, read_at, users(id, name, role)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/customer/chat" className="text-sm text-indigo-500 hover:underline">
          ← 채팅 목록
        </Link>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {ROOM_TYPE_LABEL[room.type] ?? '채팅'}
          </p>
          <p className="truncate text-xs text-gray-500">
            {req?.site_name} · {req?.company_name}
          </p>
        </div>
        {req?.id && (
          <Link
            href={`/customer/requests/${req.id}`}
            className="flex-shrink-0 text-xs text-indigo-600 hover:underline"
          >
            견적 보기 →
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatRoom
          roomId={roomId}
          currentUserId={user.id}
          currentUserRole={userData?.role ?? 'customer'}
          initialMessages={(messages ?? []) as unknown as ChatMessageWithSender[]}
          isReadOnly={false}
        />
      </div>
    </div>
  )
}
