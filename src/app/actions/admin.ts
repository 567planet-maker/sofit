'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { QuoteRequestStatus } from '@/types'

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (userData?.role !== 'admin') redirect('/customer/me')

  return { supabase, user }
}

// ─────────────────────────────────────────────────────────────
// 견적 요청 상태 변경
// ─────────────────────────────────────────────────────────────

export async function changeRequestStatus(
  requestId: string,
  toStatus: QuoteRequestStatus,
  note?: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await getAdminUser()

  const { data: req } = await supabase
    .from('quote_requests')
    .select('status, customer_id, site_name')
    .eq('id', requestId)
    .single()
  if (!req) return { error: '요청을 찾을 수 없습니다.' }

  const { error: updateError } = await supabase
    .from('quote_requests')
    .update({ status: toStatus })
    .eq('id', requestId)
  if (updateError) return { error: `상태 변경 실패: ${updateError.message}` }

  await supabase.from('status_logs').insert({
    request_id: requestId,
    from_status: req.status,
    to_status: toStatus,
    changed_by: user.id,
    note: note ?? null,
  })

  // 고객 알림
  const { data: customerUser } = await supabase
    .from('customers')
    .select('user_id')
    .eq('id', req.customer_id)
    .single()
  if (customerUser) {
    await supabase.from('notifications').insert({
      user_id: customerUser.user_id,
      type: 'status_changed',
      title: '견적 요청 상태가 변경되었습니다',
      body: `${req.site_name}`,
      link: `/customer/requests/${requestId}`,
    })
  }

  revalidatePath(`/admin/requests/${requestId}`)
  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 관리자 내부 메모
// ─────────────────────────────────────────────────────────────

export async function updateAdminNote(
  requestId: string,
  note: string,
): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { error } = await supabase
    .from('quote_requests')
    .update({ admin_note: note || null })
    .eq('id', requestId)
  if (error) return { error: `저장 실패: ${error.message}` }

  revalidatePath(`/admin/requests/${requestId}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 매칭 생성
// ─────────────────────────────────────────────────────────────

export async function createMatch(
  requestId: string,
  factoryId: string,
): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  // 중복 체크 (cancelled 제외)
  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('request_id', requestId)
    .eq('factory_id', factoryId)
    .neq('status', 'cancelled')
    .maybeSingle()
  if (existing) return { error: '이미 배포된 공장입니다.' }

  const { error } = await supabase.from('matches').insert({
    request_id: requestId,
    factory_id: factoryId,
    status: 'pending',
  })
  if (error) return { error: `매칭 생성 실패: ${error.message}` }

  // 요청 상태 → matching
  const { data: req } = await supabase
    .from('quote_requests')
    .select('status')
    .eq('id', requestId)
    .single()
  if (req && (req.status === 'submitted' || req.status === 'reviewing')) {
    await supabase.from('quote_requests').update({ status: 'matching' }).eq('id', requestId)
  }

  // 공장 사용자 알림
  const { data: factory } = await supabase
    .from('factories')
    .select('user_id')
    .eq('id', factoryId)
    .single()
  if (factory) {
    await supabase.from('notifications').insert({
      user_id: factory.user_id,
      type: 'new_match',
      title: '새 견적 요청이 배포되었습니다',
      body: '요청을 확인하고 수락하거나 거절해주세요.',
      link: `/factory/requests/${requestId}`,
    })
  }

  revalidatePath(`/admin/requests/${requestId}/match`)
  revalidatePath(`/admin/requests/${requestId}`)
  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 매칭 취소
// ─────────────────────────────────────────────────────────────

export async function cancelMatch(matchId: string): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { data: match } = await supabase
    .from('matches')
    .select('request_id, status')
    .eq('id', matchId)
    .single()
  if (!match) return { error: '매칭을 찾을 수 없습니다.' }
  if (match.status !== 'pending') return { error: '대기 중인 매칭만 취소할 수 있습니다.' }

  const { error } = await supabase
    .from('matches')
    .update({ status: 'cancelled' })
    .eq('id', matchId)
  if (error) return { error: `취소 실패: ${error.message}` }

  revalidatePath(`/admin/requests/${match.request_id}/match`)
  revalidatePath(`/admin/requests/${match.request_id}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 고객↔공장 채팅방 생성
// ─────────────────────────────────────────────────────────────

export async function createCustomerFactoryChat(
  requestId: string,
  matchId: string,
): Promise<{ error?: string; roomId?: string }> {
  const { supabase } = await getAdminUser()

  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('request_id', requestId)
    .eq('match_id', matchId)
    .eq('type', 'customer_factory')
    .maybeSingle()
  if (existing) return { roomId: existing.id }

  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert({ request_id: requestId, match_id: matchId, type: 'customer_factory' })
    .select('id')
    .single()
  if (error) return { error: `채팅방 생성 실패: ${error.message}` }

  revalidatePath(`/admin/requests/${requestId}/match`)
  revalidatePath('/admin/chats')
  return { roomId: newRoom.id }
}

// ─────────────────────────────────────────────────────────────
// 공장 승인
// ─────────────────────────────────────────────────────────────

export async function approveFactory(factoryId: string): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { data: factory, error } = await supabase
    .from('factories')
    .update({ status: 'active' })
    .eq('id', factoryId)
    .select('user_id')
    .single()
  if (error || !factory) return { error: '승인 실패' }

  await supabase.from('notifications').insert({
    user_id: factory.user_id,
    type: 'factory_approved',
    title: '파트너 승인 완료',
    body: '소핏 파트너로 승인되었습니다. 지금 바로 매칭을 받을 수 있습니다.',
    link: '/factory',
  })

  revalidatePath('/admin/factories')
  revalidatePath(`/admin/factories/${factoryId}`)
  revalidatePath('/admin')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 반려
// ─────────────────────────────────────────────────────────────

export async function rejectFactory(
  factoryId: string,
  note?: string,
): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { data: factory, error } = await supabase
    .from('factories')
    .update({ status: 'rejected' })
    .eq('id', factoryId)
    .select('user_id')
    .single()
  if (error || !factory) return { error: '반려 실패' }

  await supabase.from('notifications').insert({
    user_id: factory.user_id,
    type: 'factory_rejected',
    title: '파트너 심사 결과',
    body: note ? `반려 사유: ${note}` : '심사에서 반려되었습니다.',
    link: '/factory/pending',
  })

  revalidatePath('/admin/factories')
  revalidatePath(`/admin/factories/${factoryId}`)
  revalidatePath('/admin')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 정지
// ─────────────────────────────────────────────────────────────

export async function suspendFactory(factoryId: string): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { error } = await supabase
    .from('factories')
    .update({ status: 'suspended' })
    .eq('id', factoryId)
  if (error) return { error: '정지 실패' }

  revalidatePath('/admin/factories')
  revalidatePath(`/admin/factories/${factoryId}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 재활성화
// ─────────────────────────────────────────────────────────────

export async function activateFactory(factoryId: string): Promise<{ error?: string }> {
  const { supabase } = await getAdminUser()

  const { error } = await supabase
    .from('factories')
    .update({ status: 'active' })
    .eq('id', factoryId)
  if (error) return { error: '활성화 실패' }

  revalidatePath('/admin/factories')
  revalidatePath(`/admin/factories/${factoryId}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 관리자 채팅 메시지 전송
// ─────────────────────────────────────────────────────────────

export async function sendAdminMessage(
  roomId: string,
  content: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await getAdminUser()

  if (!content.trim()) return { error: '내용을 입력해주세요.' }

  // customer_sofit 방인지 확인 (customer_factory는 읽기 전용)
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('type')
    .eq('id', roomId)
    .single()
  if (!room) return { error: '채팅방을 찾을 수 없습니다.' }
  if (room.type === 'customer_factory') return { error: '이 채팅방은 읽기 전용입니다.' }

  const { error } = await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: user.id,
    content: content.trim(),
  })
  if (error) return { error: `전송 실패: ${error.message}` }

  revalidatePath(`/admin/chats/${roomId}`)
  return {}
}
