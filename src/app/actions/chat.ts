'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(
  roomId: string,
  content: string,
  fileUrl?: string,
  fileName?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!content.trim() && !fileUrl) return { error: '내용을 입력해주세요.' }

  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, request_id, match_id, type')
    .eq('id', roomId)
    .single()
  if (!room) return { error: '채팅방을 찾을 수 없습니다.' }

  const { error } = await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: user.id,
    content: content.trim() || null,
    file_url: fileUrl ?? null,
    file_name: fileName ?? null,
  })
  if (error) return { error: `전송 실패: ${error.message}` }

  // 상대방 알림 생성
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const msgBody = (content.trim() || '파일 첨부').slice(0, 50)

  if (room.type === 'customer_sofit') {
    if (userData?.role === 'customer') {
      // 고객→소핏: 관리자에게 알림
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin')
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map((a) => ({
            user_id: a.id,
            type: 'new_message',
            title: '새 채팅 메시지',
            body: msgBody,
            link: `/admin/chats/${roomId}`,
          })),
        )
      }
    } else if (userData?.role === 'admin') {
      // 소핏→고객: 고객에게 알림
      const { data: req } = await supabase
        .from('quote_requests')
        .select('customers(user_id)')
        .eq('id', room.request_id)
        .single()
      const customerUserId = (req?.customers as any)?.user_id
      if (customerUserId) {
        await supabase.from('notifications').insert({
          user_id: customerUserId,
          type: 'new_message',
          title: '소핏에서 메시지가 왔습니다',
          body: msgBody,
          link: `/customer/chat/${roomId}`,
        })
      }
    }
  } else if (room.type === 'customer_factory' && room.match_id) {
    const { data: match } = await supabase
      .from('matches')
      .select('factory_id, factories(user_id), request_id, quote_requests(customer_id, customers(user_id))')
      .eq('id', room.match_id)
      .single()

    if (match) {
      const factoryUserId = (match.factories as any)?.user_id
      const customerUserId = ((match.quote_requests as any)?.customers as any)?.user_id

      if (userData?.role === 'customer' && factoryUserId) {
        await supabase.from('notifications').insert({
          user_id: factoryUserId,
          type: 'new_message',
          title: '고객이 메시지를 보냈습니다',
          body: msgBody,
          link: `/factory/chat/${roomId}`,
        })
      } else if (userData?.role === 'factory' && customerUserId) {
        await supabase.from('notifications').insert({
          user_id: customerUserId,
          type: 'new_message',
          title: '공장에서 메시지가 왔습니다',
          body: msgBody,
          link: `/customer/chat/${roomId}`,
        })
      }
    }
  }

  revalidatePath(`/customer/chat/${roomId}`)
  revalidatePath(`/factory/chat/${roomId}`)
  return {}
}

export async function markRoomRead(roomId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}
