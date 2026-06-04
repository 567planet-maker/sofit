'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type RequestFileInput = {
  bucket: string
  path: string
  fileName: string
  fileSize: number
  fileType: 'image' | 'document' | 'sample'
}

export type QuoteRequestDraft = {
  // Step 1 — Required
  company_name: string
  contact: string
  site_name: string
  address: string
  site_manager: string
  available_time: string
  business_type?: string | null
  has_parking?: boolean | null
  floor?: number | null
  has_elevator?: boolean | null

  // Step 2 — Optional
  sofa_type?: string | null
  sofa_count?: number | null
  seat_count?: number | null
  backrest_height?: string | null
  has_armrest?: boolean | null
  cushion_type?: string | null
  frame_structure?: string | null
  flame_retardant?: boolean | null
  waterproof?: boolean | null

  // Step 3 — Optional specs
  total_length?: number | null
  total_width?: number | null
  total_height?: number | null
  seat_height?: number | null
  seat_depth?: number | null
  wall_length?: number | null
  corner_angle?: number | null

  // Step 4 — Optional materials
  fabric_type?: string | null
  inner_material?: string | null
  frame_material?: string | null
  color_code?: string | null

  // Step 5 — Schedule
  needs_measurement?: boolean | null
  install_hours?: number | null
  measurement_date?: string | null
  production_start?: string | null
  production_end?: string | null
  delivery_date?: string | null
  install_date?: string | null
  as_available_date?: string | null
}

export async function submitQuoteRequest(
  data: QuoteRequestDraft,
  files: RequestFileInput[] = [],
): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/customer/request')

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login?redirect=/customer/request')

  const { data: request, error } = await supabase
    .from('quote_requests')
    .insert({
      customer_id: customer.id,
      status: 'submitted',
      ...data,
    })
    .select('id')
    .single()

  if (error || !request) {
    return { error: '제출에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  // 업로드된 파일 메타데이터 저장
  if (files.length > 0) {
    await supabase.from('request_files').insert(
      files.map((f) => ({
        request_id: request.id,
        file_type: f.fileType,
        file_url: f.path,
        file_name: f.fileName,
        file_size: f.fileSize,
      })),
    )
  }

  // customer_sofit 채팅방 자동 생성
  await supabase.from('chat_rooms').insert({
    request_id: request.id,
    match_id: null,
    type: 'customer_sofit',
  })

  // Admin 알림 생성
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'new_request',
        title: '새 견적 요청이 접수됐습니다',
        body: `${data.company_name} — ${data.site_name}`,
        link: `/admin/requests/${request.id}`,
      })),
    )
  }

  redirect(`/customer/request/submitted?id=${request.id}`)
}

// ─────────────────────────────────────────────────────────────
// 고객이 특정 공장의 견적서를 수락 → quote_requests.status = 'contracted'
// ─────────────────────────────────────────────────────────────
export async function acceptFactoryQuote(
  requestId: string,
  matchId: string,
): Promise<{ error?: string }> {
  // 인증 검증은 user 클라이언트로
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증 오류' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) return { error: '고객 정보를 찾을 수 없습니다.' }

  // 소유권 확인
  const { data: request } = await supabase
    .from('quote_requests')
    .select('id, status')
    .eq('id', requestId)
    .eq('customer_id', customer.id)
    .single()
  if (!request) return { error: '견적 요청을 찾을 수 없습니다.' }
  if (request.status === 'contracted') return { error: '이미 계약이 완료된 요청입니다.' }

  // 매칭이 이 요청 소속인지 확인
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, factory_id')
    .eq('id', matchId)
    .eq('request_id', requestId)
    .single()
  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'confirmed') return { error: '수락된 매칭이 아닙니다.' }

  // DB 쓰기는 service client로 (RLS 우회 — 위에서 권한 검증 완료)
  const db = createServiceClient()

  const { error: quoteError } = await db
    .from('factory_quotes')
    .update({ status: 'accepted' })
    .eq('match_id', matchId)
    .eq('is_latest', true)
    .eq('status', 'submitted')
  if (quoteError) return { error: '견적서 수락 처리 실패' }

  const { error: reqError } = await db
    .from('quote_requests')
    .update({ status: 'contracted' })
    .eq('id', requestId)
  if (reqError) return { error: '상태 업데이트 실패' }

  await db.from('status_logs').insert({
    request_id: requestId,
    from_status: request.status,
    to_status: 'contracted',
    changed_by: user.id,
    note: '고객이 견적서를 최종 수락했습니다',
  })

  const { data: factoryUser } = await db
    .from('factories')
    .select('user_id')
    .eq('id', match.factory_id)
    .single()

  if (factoryUser) {
    const { data: reqInfo } = await db
      .from('quote_requests')
      .select('site_name')
      .eq('id', requestId)
      .single()

    await db.from('notifications').insert({
      user_id: factoryUser.user_id,
      type: 'status_changed',
      title: '견적서가 수락되었습니다',
      body: `${reqInfo?.site_name ?? ''} — 고객이 최종 계약을 확정했습니다`,
      link: `/factory/requests/${requestId}`,
    })
  }

  revalidatePath(`/customer/requests/${requestId}/quotes`)
  revalidatePath(`/customer/requests/${requestId}`)
  revalidatePath('/customer/requests')
  return {}
}
