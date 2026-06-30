'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Supabase 중첩 select는 관계 추론에 따라 객체 또는 배열을 반환할 수 있어
// 양쪽을 모두 단일 객체로 정규화한다.
function pickOne<T>(v: T | T[] | null | undefined): T | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

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

  // 채팅 스팸 방어: 사용자당 1분에 40회
  if (!(await checkRateLimit('chat_send', user.id, 40, 60))) {
    return { error: '메시지를 너무 많이 보냈습니다. 잠시 후 다시 시도해주세요.' }
  }

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
      const customerUserId = pickOne<{ user_id: string }>(req?.customers)?.user_id
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
      const factoryUserId = pickOne<{ user_id: string }>(match.factories)?.user_id
      const quoteRequest = pickOne<{ customers: { user_id: string } | { user_id: string }[] }>(
        match.quote_requests,
      )
      const customerUserId = pickOne<{ user_id: string }>(quoteRequest?.customers)?.user_id

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
