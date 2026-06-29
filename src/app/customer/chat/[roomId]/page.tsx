import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatRoom from '@/components/chat/ChatRoom'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import Avatar from '@/components/ui/Avatar'
import type { ChatMessageWithSender } from '@/types'
// 좌측 채팅방 목록은 부모 layout.tsx 에서 렌더링됩니다.

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
    .select(
      'id, type, request_id, match_id, quote_requests(id, site_name, company_name), matches(factories(company_name))',
    )
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
  const factoryCompany = (room as any).matches?.factories?.company_name as string | undefined

  // 메시지 목록
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_url, file_name, created_at, sender_id, read_at, users(id, name, role, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  // 상대(발신자) 이름·사진
  const cpMsg = ((messages ?? []) as any[]).find((m) => m.sender_id !== user.id)
  const cpName = cpMsg?.users?.name as string | undefined
  const cpAvatar = (cpMsg?.users?.avatar_url as string | null) ?? null
  const headerName =
    room.type === 'customer_factory'
      ? factoryCompany ?? cpName ?? '공장 직접 채팅'
      : cpName ?? ROOM_TYPE_LABEL[room.type] ?? '채팅'

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <ChatHeaderBar>
        <Avatar src={cpAvatar} name={headerName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{headerName}</p>
          <p className="truncate text-xs text-ink-muted">
            {req?.site_name} · {req?.company_name}
          </p>
        </div>
        {req?.id && (
          <Link
            href={`/customer/requests/${req.id}`}
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
          currentUserRole={userData?.role ?? 'customer'}
          initialMessages={(messages ?? []) as unknown as ChatMessageWithSender[]}
          isReadOnly={false}
        />
      </div>
    </div>
  )
}
