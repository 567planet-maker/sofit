'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { COMMON_FIELDS, COMMON_COLUMN_MAP } from '@/app/customer/request/schema/commonSchema'
import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import {
  isCategoryKey,
  CATEGORY_LABELS,
  type CategoryKey,
} from '@/app/customer/request/schema/categories'
import { isUnknownValue } from '@/app/customer/request/schema/types'

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

// ─────────────────────────────────────────────────────────────
// 분야(item)별 견적 수락 (Phase 7) — 분야마다 다른 공장 선택 가능
//   선택한 (match,item) 견적 → accepted, 같은 item의 다른 공장 견적 → rejected,
//   해당 item → contracted. 모든 item이 contracted면 요청 전체 계약 확정.
// ─────────────────────────────────────────────────────────────
export async function acceptItemQuote(
  requestId: string,
  itemId: string,
  matchId: string,
): Promise<{ error?: string }> {
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

  // 요청 소유권
  const { data: request } = await supabase
    .from('quote_requests')
    .select('id, status')
    .eq('id', requestId)
    .eq('customer_id', customer.id)
    .single()
  if (!request) return { error: '견적 요청을 찾을 수 없습니다.' }
  if (request.status === 'contracted') return { error: '이미 계약이 완료된 요청입니다.' }

  // 매칭이 이 요청 소속인지 + item이 이 요청 소속인지
  const { data: match } = await supabase
    .from('matches')
    .select('id, factory_id')
    .eq('id', matchId)
    .eq('request_id', requestId)
    .single()
  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }

  const { data: item } = await supabase
    .from('quote_request_items')
    .select('id, category')
    .eq('id', itemId)
    .eq('request_id', requestId)
    .single()
  if (!item) return { error: '분야 항목을 찾을 수 없습니다.' }

  // 권한 검증 완료 → service client
  const db = createServiceClient()

  // 선택한 (match,item)의 최신 submitted 견적
  const { data: chosen } = await db
    .from('factory_quotes')
    .select('id')
    .eq('match_id', matchId)
    .eq('item_id', itemId)
    .eq('is_latest', true)
    .eq('status', 'submitted')
    .maybeSingle()
  if (!chosen) return { error: '선택한 분야의 제출된 견적서를 찾을 수 없습니다.' }

  // 선택 → accepted
  const { error: accErr } = await db
    .from('factory_quotes')
    .update({ status: 'accepted' })
    .eq('id', chosen.id)
  if (accErr) return { error: '견적 수락 처리에 실패했습니다.' }

  // 같은 item의 다른 공장 submitted 견적 → rejected (item_id는 요청 단일 소속이라 범위 안전)
  await db
    .from('factory_quotes')
    .update({ status: 'rejected' })
    .eq('item_id', itemId)
    .eq('status', 'submitted')
    .neq('id', chosen.id)

  // 해당 분야 계약 처리
  await db.from('quote_request_items').update({ status: 'contracted' }).eq('id', itemId)

  // 낙찰 공장 알림
  const categoryLabel = CATEGORY_LABELS[item.category as CategoryKey] ?? item.category
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
      body: `${reqInfo?.site_name ?? ''} — ${categoryLabel} 분야 계약이 확정되었습니다`,
      link: `/factory/requests/${requestId}`,
    })
  }

  // 모든 분야가 계약되면 요청 전체 계약 확정
  const { data: allItems } = await db
    .from('quote_request_items')
    .select('status')
    .eq('request_id', requestId)
  const itemStatuses = (allItems ?? []) as Array<{ status: string }>
  const allContracted =
    itemStatuses.length > 0 && itemStatuses.every((i) => i.status === 'contracted')

  if (allContracted) {
    await db.from('quote_requests').update({ status: 'contracted' }).eq('id', requestId)
    await db.from('status_logs').insert({
      request_id: requestId,
      from_status: request.status,
      to_status: 'contracted',
      changed_by: user.id,
      note: '모든 분야 견적 수락 — 계약 확정',
    })
  } else if (request.status === 'quote_arrived' || request.status === 'matching') {
    // 일부 분야 계약 진행 중
    await db.from('quote_requests').update({ status: 'negotiating' }).eq('id', requestId)
  }

  revalidatePath(`/customer/requests/${requestId}/quotes`)
  revalidatePath(`/customer/requests/${requestId}`)
  revalidatePath('/customer/requests')
  return {}
}

// ═════════════════════════════════════════════════════════════
// 다분야 견적 (Phase 3) — draft-first 서버 액션
//   ensureDraft / saveCommonInfo / upsertCategoryItem /
//   removeCategoryItem / getQuoteRequest / submitQuoteDraft
//
// 보안: 모든 액션은 user 클라이언트로 소유권을 먼저 검증한 뒤,
//   쓰기는 service 클라이언트로 수행한다(quote_requests는 고객 UPDATE
//   정책이 없으므로). 검증을 통과하지 못하면 어떤 쓰기도 하지 않는다.
// ═════════════════════════════════════════════════════════════

function isFilled(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

type OwnedDraft = { userId: string; request: Record<string, unknown> }

// 현재 사용자가 소유한 요청을 로드. requireDraft면 draft 상태만 허용.
async function loadOwnedRequest(
  requestId: string,
  opts: { requireDraft?: boolean } = {},
): Promise<{ error: string } | OwnedDraft> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) return { error: '고객 정보를 찾을 수 없습니다.' }

  const { data: request } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', requestId)
    .eq('customer_id', customer.id)
    .maybeSingle()
  if (!request) return { error: '요청을 찾을 수 없습니다.' }

  if (opts.requireDraft && request.status !== 'draft') {
    return { error: '이미 제출된 요청은 수정할 수 없습니다.' }
  }
  return { userId: user.id, request: request as Record<string, unknown> }
}

// ── 진입 시 draft 보장 (고객당 진행중 draft 1건) ──────────────
export async function ensureDraft(): Promise<{ requestId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) return { error: '고객 정보를 찾을 수 없습니다.' }

  // 기존 draft 재사용
  const { data: existing } = await supabase
    .from('quote_requests')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return { requestId: existing.id }

  // 신규 draft 생성 (RLS 고객 INSERT 정책 적용)
  const { data: created, error } = await supabase
    .from('quote_requests')
    .insert({ customer_id: customer.id, status: 'draft' })
    .select('id')
    .single()
  if (error || !created) return { error: '임시저장 생성에 실패했습니다.' }

  return { requestId: created.id }
}

// ── 항상 새 견적 시작 (단, 손도 안 댄 빈 draft가 있으면 재사용) ──
// "견적 요청" 진입 시 사용. 매번 새로 시작하되, 클릭만 반복해도
// 완전히 빈 draft가 쌓이지 않도록 제목·현장명·분야가 모두 없는
// draft 하나는 재사용한다.
export async function createDraft(): Promise<{ requestId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) return { error: '고객 정보를 찾을 수 없습니다.' }

  // 가장 최근 draft가 "완전히 비어 있으면" 재사용 (빈 draft 누적 방지)
  const { data: latest } = await supabase
    .from('quote_requests')
    .select('id, title, site_name, site_address, area_m2')
    .eq('customer_id', customer.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest && !latest.title && !latest.site_name && !latest.site_address && latest.area_m2 == null) {
    const { count } = await supabase
      .from('quote_request_items')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', latest.id)
    if (!count) return { requestId: latest.id }
  }

  const { data: created, error } = await supabase
    .from('quote_requests')
    .insert({ customer_id: customer.id, status: 'draft' })
    .select('id')
    .single()
  if (error || !created) return { error: '견적 생성에 실패했습니다.' }

  return { requestId: created.id }
}

// ── 공통 정보 부분 저장 (화이트리스트 매핑) ───────────────────
export async function saveCommonInfo(
  requestId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true } | { error: string }> {
  const owned = await loadOwnedRequest(requestId, { requireDraft: true })
  if ('error' in owned) return { error: owned.error }

  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    const column = COMMON_COLUMN_MAP[key]
    if (!column) continue // 화이트리스트 외 키 무시
    update[column] = value
  }
  if (Object.keys(update).length === 0) return { ok: true }

  const db = createServiceClient()
  const { error } = await db.from('quote_requests').update(update).eq('id', requestId)
  if (error) return { error: '저장에 실패했습니다.' }
  return { ok: true }
}

// ── 분야 항목 추가/상세 저장 (details merge upsert) ───────────
export async function upsertCategoryItem(
  requestId: string,
  category: string,
  detailsPatch: Record<string, unknown>,
): Promise<{ ok: true } | { error: string }> {
  if (!isCategoryKey(category) || !getCategorySchema(category)) {
    return { error: '지원하지 않는 분야입니다.' }
  }
  const owned = await loadOwnedRequest(requestId, { requireDraft: true })
  if ('error' in owned) return { error: owned.error }

  const db = createServiceClient()
  const { data: existing } = await db
    .from('quote_request_items')
    .select('id, details')
    .eq('request_id', requestId)
    .eq('category', category)
    .maybeSingle()

  if (existing) {
    const merged = { ...((existing.details as Record<string, unknown>) ?? {}), ...detailsPatch }
    const { error } = await db
      .from('quote_request_items')
      .update({ details: merged })
      .eq('id', existing.id)
    if (error) return { error: '저장에 실패했습니다.' }
  } else {
    const { error } = await db
      .from('quote_request_items')
      .insert({ request_id: requestId, category, details: detailsPatch })
    if (error) return { error: '분야 추가에 실패했습니다.' }
  }
  return { ok: true }
}

// ── 분야 항목 제거 ───────────────────────────────────────────
export async function removeCategoryItem(
  requestId: string,
  category: string,
): Promise<{ ok: true } | { error: string }> {
  const owned = await loadOwnedRequest(requestId, { requireDraft: true })
  if ('error' in owned) return { error: owned.error }

  const db = createServiceClient()
  const { error } = await db
    .from('quote_request_items')
    .delete()
    .eq('request_id', requestId)
    .eq('category', category)
  if (error) return { error: '분야 제거에 실패했습니다.' }
  return { ok: true }
}

// ── 부모 + items + attachments 조회 (소유자/RLS) ─────────────
export async function getQuoteRequest(
  requestId: string,
): Promise<
  | {
      request: Record<string, unknown>
      items: Array<{ id: string; category: string; details: Record<string, unknown> }>
      attachments: Array<Record<string, unknown>>
    }
  | { error: string }
> {
  const supabase = await createClient()
  const { data: request } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()
  if (!request) return { error: '요청을 찾을 수 없습니다.' }

  const { data: items } = await supabase
    .from('quote_request_items')
    .select('id, category, details, status')
    .eq('request_id', requestId)
  const { data: attachments } = await supabase
    .from('quote_request_attachments')
    .select('*')
    .eq('request_id', requestId)

  return {
    request: request as Record<string, unknown>,
    items: (items ?? []) as Array<{
      id: string
      category: string
      details: Record<string, unknown>
    }>,
    attachments: (attachments ?? []) as Array<Record<string, unknown>>,
  }
}

// ── 검증 + 제출 (draft → submitted) ──────────────────────────
type ValidationError = { scope: 'common' | CategoryKey; key: string; label: string }

export async function submitQuoteDraft(requestId: string): Promise<
  | { ok: true }
  | { ok: false; errors: ValidationError[] }
  | { error: string }
> {
  const owned = await loadOwnedRequest(requestId, { requireDraft: true })
  if ('error' in owned) return { error: owned.error }
  const { userId, request } = owned

  const db = createServiceClient()
  const { data: items } = await db
    .from('quote_request_items')
    .select('id, category, details')
    .eq('request_id', requestId)

  const itemList = (items ?? []) as Array<{
    id: string
    category: string
    details: Record<string, unknown>
  }>

  // 분야 최소 1개
  if (itemList.length === 0) {
    return { error: '최소 한 개 분야를 선택하고 작성해주세요.' }
  }

  // 공통 필수 검증
  const errors: ValidationError[] = []
  for (const f of COMMON_FIELDS) {
    if (!f.required) continue
    const column = COMMON_COLUMN_MAP[f.key] ?? f.key
    if (!isFilled(request[column])) {
      errors.push({ scope: 'common', key: f.key, label: f.label })
    }
  }

  // 분야별 필수 검증 (__unknown = "모름" 선택도 통과로 인정)
  for (const item of itemList) {
    if (!isCategoryKey(item.category)) continue
    const schema = getCategorySchema(item.category)
    if (!schema) continue
    for (const f of schema.fields) {
      if (!f.required) continue
      const v = item.details?.[f.key]
      if (!isFilled(v) && !isUnknownValue(v)) {
        errors.push({ scope: item.category, key: f.key, label: f.label })
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  // ── 제출 처리 (소유권 검증 완료 → service client) ──
  const now = new Date().toISOString()
  const { error: updErr } = await db
    .from('quote_requests')
    .update({ status: 'submitted', submitted_at: now })
    .eq('id', requestId)
  if (updErr) return { error: '제출 처리에 실패했습니다.' }

  // 제출 시점 스냅샷
  await db.from('quote_request_revisions').insert({
    request_id: requestId,
    snapshot: { request: { ...request, status: 'submitted' }, items: itemList },
    reason: 'submitted',
    created_by: userId,
  })

  // customer_sofit 채팅방 생성 (보정 #2: draft가 아니라 제출 시점에 생성)
  await db
    .from('chat_rooms')
    .insert({ request_id: requestId, match_id: null, type: 'customer_sofit' })

  // 관리자 알림
  const { data: admins } = await db.from('users').select('id').eq('role', 'admin')
  if (admins && admins.length > 0) {
    const siteName = (request.site_name as string) ?? '제목 없음'
    await db.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'new_request',
        title: '새 견적 요청이 접수됐습니다',
        body: `${siteName} — 분야 ${itemList.length}개`,
        link: `/admin/requests/${requestId}`,
      })),
    )
  }

  await db.from('status_logs').insert({
    request_id: requestId,
    from_status: 'draft',
    to_status: 'submitted',
    changed_by: userId,
    note: '고객이 견적 요청을 제출했습니다',
  })

  // ── 분야별 자동 매칭 (Phase 7): item별 시공 가능 공장에 매칭 생성 ──
  await autoMatchByCategory(db, requestId, itemList)

  revalidatePath('/customer/requests')
  return { ok: true }
}

/**
 * 제출된 요청의 분야(들)를 시공 가능한 active 공장에 자동 매칭한다.
 * - 요청에 포함된 분야 중 하나라도 시공하는 공장이면 매칭(요청 단위, item_id NULL)
 * - 기존 admin `createMatch`와 동일한 'pending' 매칭 → 공장이 수락/거절
 *   (단일 match 기준의 견적서·채팅 플로우를 그대로 재사용하기 위해 요청 단위)
 * - 매칭이 하나라도 생기면 요청 status → 'matching', 공장에 알림
 * 매칭 대상 공장이 없으면 status는 'submitted'로 남아 관리자가 수동 배정.
 *
 * ※ 분야(item) 단위 매칭/견적(matches.item_id·factory_quotes.item_id)은
 *   공장 "분야별 견적서 UI"(개발순서 Phase 7 step 2·3)와 함께 도입한다.
 */
async function autoMatchByCategory(
  db: ReturnType<typeof createServiceClient>,
  requestId: string,
  items: Array<{ category: string }>,
): Promise<void> {
  const categories = [...new Set(items.map((i) => i.category).filter(isCategoryKey))]
  if (categories.length === 0) return

  // 요청 분야 중 하나라도 시공하는 active 공장 (한 번의 쿼리, 공장 단위 dedup)
  const { data: rows } = await db
    .from('factory_categories')
    .select('factory_id, factories!inner(status)')
    .in('category', categories)
    .eq('factories.status', 'active')

  const factoryIds = [
    ...new Set((rows ?? []).map((r) => (r as { factory_id: string }).factory_id)),
  ]
  if (factoryIds.length === 0) return

  // 요청 단위 매칭 생성 (UNIQUE(request_id, factory_id) 충돌은 무시 — 기존 매칭 보존)
  await db.from('matches').upsert(
    factoryIds.map((factory_id) => ({ request_id: requestId, factory_id, status: 'pending' })),
    { onConflict: 'request_id,factory_id', ignoreDuplicates: true },
  )

  // 요청 상태 → matching (submitted에서만 전환, 기존 createMatch와 동일 규약)
  await db
    .from('quote_requests')
    .update({ status: 'matching' })
    .eq('id', requestId)
    .eq('status', 'submitted')

  // 매칭된 공장 사용자에게 알림
  const { data: facUsers } = await db.from('factories').select('user_id').in('id', factoryIds)
  if (facUsers && facUsers.length > 0) {
    await db.from('notifications').insert(
      facUsers.map((f) => ({
        user_id: f.user_id as string,
        type: 'new_match',
        title: '새 견적 요청이 도착했습니다',
        body: '전문 분야에 맞는 견적 요청이 매칭되었습니다. 확인해주세요.',
        link: `/factory/requests/${requestId}`,
      })),
    )
  }
}
