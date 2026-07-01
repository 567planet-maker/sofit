'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  isCategoryKey,
  CATEGORY_LABELS,
  type CategoryKey,
} from '@/app/customer/request/schema/categories'

type SBClient = Awaited<ReturnType<typeof createClient>>

// ─────────────────────────────────────────────────────────────
// 공장 프로필 생성
// ─────────────────────────────────────────────────────────────

interface FactoryProfileInput {
  company_name: string
  location?: string
  description?: string
}

export async function createFactoryProfile(input: FactoryProfileInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { error } = await supabase.from('factories').insert({
    user_id: user!.id,
    company_name: input.company_name,
    location: input.location ?? null,
    description: input.description ?? null,
    status: 'pending',
  })

  if (error) throw new Error(`공장 프로필 생성 실패: ${error.message}`)

  // 고객 → 공장 전환: 역할을 factory 로 승격 (auth 메타데이터 + users 테이블).
  // 승인(active) 후 /factory 보호 영역 접근에 factory 역할이 필요하다.
  await supabase.auth.updateUser({ data: { role: 'factory' } })
  await supabase.from('users').update({ role: 'factory' }).eq('id', user!.id)

  redirect('/factory/pending')
}

// ─────────────────────────────────────────────────────────────
// 공장 인증 헬퍼
// ─────────────────────────────────────────────────────────────

async function getAuthFactory() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: factory } = await supabase
    .from('factories')
    .select('id, company_name, status')
    .eq('user_id', user.id)
    .single()
  if (!factory) redirect('/factory/onboarding')
  // active 공장만 매칭/견적/채팅/포트폴리오 등 행위 가능.
  // pending·rejected·suspended는 안내 페이지로 차단(레이아웃과 이중 방어).
  if (factory.status !== 'active') redirect('/factory/pending')

  return { supabase, user, factory }
}

// ─────────────────────────────────────────────────────────────
// 매칭 수락
// ─────────────────────────────────────────────────────────────

export async function acceptMatch(
  matchId: string,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { data: match } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('id', matchId)
    .eq('factory_id', factory.id)
    .single()

  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'pending') return { error: '이미 처리된 요청입니다.' }

  const { data: updated, error } = await supabase
    .from('matches')
    .update({ status: 'confirmed' })
    .eq('id', matchId)
    .select('id')
    .maybeSingle()
  if (error) return { error: `수락 처리 실패: ${error.message}` }
  if (!updated) return { error: 'RLS 정책 오류: Supabase에서 002_w5_storage.sql 마이그레이션을 실행해주세요.' }

  // customer_factory 채팅방 자동 생성 (중복 방지)
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('match_id', matchId)
    .eq('type', 'customer_factory')
    .maybeSingle()
  if (!existingRoom) {
    await supabase.from('chat_rooms').insert({
      request_id: match.request_id,
      match_id: matchId,
      type: 'customer_factory',
    })
  }

  // 관리자 알림
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'new_match',
        title: `${factory.company_name}이(가) 매칭을 수락했습니다`,
        body: null,
        link: `/admin/requests/${match.request_id}`,
      })),
    )
  }

  revalidatePath(`/factory/requests/${match.request_id}`)
  revalidatePath('/factory/requests')
  revalidatePath('/admin/chats')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 매칭 거절
// ─────────────────────────────────────────────────────────────

export async function rejectMatch(
  matchId: string,
  note?: string,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { data: match } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('id', matchId)
    .eq('factory_id', factory.id)
    .single()

  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'pending') return { error: '이미 처리된 요청입니다.' }

  const { data: updated, error } = await supabase
    .from('matches')
    .update({ status: 'rejected', note: note ?? null })
    .eq('id', matchId)
    .select('id')
    .maybeSingle()
  if (error) return { error: `거절 처리 실패: ${error.message}` }
  if (!updated) return { error: 'RLS 정책 오류: Supabase에서 002_w5_storage.sql 마이그레이션을 실행해주세요.' }

  // 관리자 알림
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: 'new_match',
        title: `${factory.company_name}이(가) 매칭을 거절했습니다`,
        body: note ?? null,
        link: `/admin/requests/${match.request_id}`,
      })),
    )
  }

  revalidatePath(`/factory/requests/${match.request_id}`)
  revalidatePath('/factory/requests')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 자율 참여 — 고객 요청서에 직접 매칭 참여
// ─────────────────────────────────────────────────────────────

export async function joinRequest(
  requestId: string,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()
  // getAuthFactory가 이미 active를 보장하므로 별도 상태 재확인은 불필요.

  // 참여 남용 방어: 공장당 1분에 30회
  if (!(await checkRateLimit('factory_join', factory.id, 30, 60))) {
    return { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
  }

  // 요청서 존재·참여 가능 여부 확인
  const { data: request } = await supabase
    .from('quote_requests')
    .select('id, status, customer_id')
    .eq('id', requestId)
    .single()
  if (!request) return { error: '견적 요청을 찾을 수 없습니다.' }
  if (['contracted', 'in_progress', 'completed'].includes(request.status)) {
    return { error: '이미 완료된 요청입니다.' }
  }

  // 중복 참여 방지
  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('request_id', requestId)
    .eq('factory_id', factory.id)
    .maybeSingle()
  if (existing) return { error: '이미 참여한 요청입니다.' }

  const db = createServiceClient()

  // 매칭 레코드 생성 (바로 confirmed)
  const { data: newMatch, error: matchError } = await db
    .from('matches')
    .insert({ request_id: requestId, factory_id: factory.id, status: 'confirmed' })
    .select('id')
    .single()
  if (matchError) return { error: '참여 처리 실패' }

  // 고객↔공장 채팅방 즉시 개설
  await db.from('chat_rooms').insert({
    request_id: requestId,
    match_id: newMatch.id,
    type: 'customer_factory',
  })

  // 요청서 상태를 submitted → matching으로 자동 전환
  await db
    .from('quote_requests')
    .update({ status: 'matching' })
    .eq('id', requestId)
    .eq('status', 'submitted')

  // 고객 알림
  const { data: customerUser } = await db
    .from('customers')
    .select('user_id')
    .eq('id', request.customer_id)
    .single()

  if (customerUser) {
    const { data: reqInfo } = await db
      .from('quote_requests')
      .select('site_name')
      .eq('id', requestId)
      .single()

    await db.from('notifications').insert({
      user_id: customerUser.user_id,
      type: 'new_match',
      title: `${factory.company_name}이(가) 견적에 참여했습니다`,
      body: reqInfo?.site_name ?? '',
      link: `/customer/requests/${requestId}`,
    })
  }

  revalidatePath(`/factory/requests/${requestId}`)
  revalidatePath('/factory/requests')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 견적서 타입
// ─────────────────────────────────────────────────────────────

export type QuoteInput = {
  material_cost: number
  labor_cost: number
  delivery_cost: number
  install_cost: number
  demolition_cost: number
  extra_cost: number
  margin: number
  delivery_days?: number | null
  scope?: string | null
  note?: string | null
}

// ─────────────────────────────────────────────────────────────
// 견적서 임시저장
// ─────────────────────────────────────────────────────────────

/**
 * 견적 작성 권한 검증: 매칭 소유(confirmed) + item이 그 요청 소속.
 * 공장은 참여한 요청의 어떤 분야든 견적할 수 있다(전문 분야는 UI 강조용일 뿐 제한 아님).
 * 분야(item) 단위 견적의 공통 가드.
 */
async function loadQuotableItem(
  supabase: SBClient,
  factoryId: string,
  matchId: string,
  itemId: string,
): Promise<{ requestId: string; category: string } | { error: string }> {
  const { data: match } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('id', matchId)
    .eq('factory_id', factoryId)
    .single()
  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'confirmed') return { error: '수락된 요청에만 견적서를 작성할 수 있습니다.' }

  const { data: item } = await supabase
    .from('quote_request_items')
    .select('id, category')
    .eq('id', itemId)
    .eq('request_id', match.request_id)
    .single()
  if (!item) return { error: '분야 항목을 찾을 수 없습니다.' }

  return { requestId: match.request_id as string, category: item.category as string }
}

export async function saveQuoteDraft(
  matchId: string,
  itemId: string,
  data: QuoteInput,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const ctx = await loadQuotableItem(supabase, factory.id, matchId, itemId)
  if ('error' in ctx) return { error: ctx.error }

  // 기존 draft 조회 (match + item 단위)
  const { data: existing } = await supabase
    .from('factory_quotes')
    .select('id')
    .eq('match_id', matchId)
    .eq('item_id', itemId)
    .eq('status', 'draft')
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('factory_quotes')
      .update({ ...data, status: 'draft' })
      .eq('id', existing.id)
    if (error) return { error: '임시저장 실패' }
  } else {
    // draft는 is_latest=false (최신 submitted만 is_latest=true)
    const { error } = await supabase
      .from('factory_quotes')
      .insert({ match_id: matchId, item_id: itemId, ...data, status: 'draft', is_latest: false })
    if (error) return { error: '임시저장 실패' }
  }

  revalidatePath(`/factory/requests/${ctx.requestId}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 견적서 고객에게 제출 (버전 관리 지원)
// ─────────────────────────────────────────────────────────────

export async function submitFactoryQuote(
  matchId: string,
  itemId: string,
  data: QuoteInput,
): Promise<{ error?: string }> {
  const { supabase, factory, user } = await getAuthFactory()

  // 견적 제출 남용 방어: 공장당 1분에 30회
  if (!(await checkRateLimit('factory_quote_submit', factory.id, 30, 60))) {
    return { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
  }

  const ctx = await loadQuotableItem(supabase, factory.id, matchId, itemId)
  if ('error' in ctx) return { error: ctx.error }
  const requestId = ctx.requestId

  // 1. 현재 최신 submitted 버전 조회 (match + item 단위)
  const { data: latestQuote } = await supabase
    .from('factory_quotes')
    .select('id, version')
    .eq('match_id', matchId)
    .eq('item_id', itemId)
    .eq('is_latest', true)
    .eq('status', 'submitted')
    .maybeSingle()

  const nextVersion = (latestQuote?.version ?? 0) + 1

  // 2. 기존 submitted → superseded 처리
  if (latestQuote) {
    await supabase
      .from('factory_quotes')
      .update({ status: 'superseded', is_latest: false })
      .eq('id', latestQuote.id)
  }

  // 3. 해당 item의 draft 삭제
  await supabase
    .from('factory_quotes')
    .delete()
    .eq('match_id', matchId)
    .eq('item_id', itemId)
    .eq('status', 'draft')

  // 4. 새 버전 insert
  const { error: insertError } = await supabase
    .from('factory_quotes')
    .insert({
      match_id: matchId,
      item_id: itemId,
      ...data,
      version: nextVersion,
      status: 'submitted',
      is_latest: true,
    })
  if (insertError) return { error: `견적서 제출 실패: ${insertError.message}` }

  // 5. quote_request 상태 업데이트 (service client로 RLS 우회 — 위에서 공장 권한 검증 완료)
  const db = createServiceClient()
  await db
    .from('quote_requests')
    .update({ status: 'quote_arrived' })
    .eq('id', requestId)
    .in('status', ['submitted', 'reviewing', 'matching'])

  // 6. 채팅방에 자동 메시지 발송
  await sendQuoteRevisionChatMessage(supabase, matchId, user.id, nextVersion)

  // 7. 고객 알림
  const categoryLabel = CATEGORY_LABELS[ctx.category as CategoryKey] ?? ctx.category
  const { data: reqRow } = await db
    .from('quote_requests')
    .select('customer_id, site_name')
    .eq('id', requestId)
    .single()

  if (reqRow) {
    const { data: customerUser } = await db
      .from('customers')
      .select('user_id')
      .eq('id', reqRow.customer_id)
      .single()

    if (customerUser) {
      await db.from('notifications').insert({
        user_id: customerUser.user_id,
        type: 'quote_arrived',
        title: nextVersion === 1 ? '견적서가 도착했습니다' : `수정 견적서(v${nextVersion})가 도착했습니다`,
        body: `${reqRow.site_name} — ${factory.company_name} (${categoryLabel})`,
        link: `/customer/requests/${requestId}/quotes`,
      })
    }
  }

  revalidatePath(`/factory/requests/${requestId}`)
  revalidatePath('/factory/requests')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 견적서 제출 시 채팅방 자동 메시지
// ─────────────────────────────────────────────────────────────

async function sendQuoteRevisionChatMessage(
  supabase: SBClient,
  matchId: string,
  senderUserId: string,
  version: number,
): Promise<void> {
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('match_id', matchId)
    .eq('type', 'customer_factory')
    .maybeSingle()

  if (!room) return

  await supabase.from('chat_messages').insert({
    room_id: room.id,
    sender_id: senderUserId,
    content:
      version === 1
        ? '견적서를 제출했습니다. 확인해 주세요.'
        : `수정 견적서(v${version})를 제출했습니다. 변경 내용을 확인해 주세요.`,
  })
}

// ─────────────────────────────────────────────────────────────
// 포트폴리오 CRUD
// ─────────────────────────────────────────────────────────────

export type PortfolioInput = {
  image_url: string
  description?: string | null
  category?: 'sofa' | 'builtin' | 'other' | null
  completed_at?: string | null
}

export async function createPortfolio(
  data: PortfolioInput,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { error } = await supabase.from('factory_portfolios').insert({
    factory_id: factory.id,
    image_url: data.image_url,
    description: data.description ?? null,
    category: data.category ?? null,
    completed_at: data.completed_at ?? null,
  })
  if (error) return { error: `등록 실패: ${error.message}` }

  revalidatePath('/factory/portfolios')
  revalidatePath('/portfolios')
  return {}
}

export async function updatePortfolio(
  portfolioId: string,
  data: Omit<PortfolioInput, 'image_url'>,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { error } = await supabase
    .from('factory_portfolios')
    .update({
      description: data.description ?? null,
      category: data.category ?? null,
      completed_at: data.completed_at ?? null,
    })
    .eq('id', portfolioId)
    .eq('factory_id', factory.id)
  if (error) return { error: `수정 실패: ${error.message}` }

  revalidatePath('/factory/portfolios')
  revalidatePath('/portfolios')
  return {}
}

export async function deletePortfolio(
  portfolioId: string,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  // 이미지 경로 조회 후 스토리지에서도 삭제
  const { data: portfolio } = await supabase
    .from('factory_portfolios')
    .select('image_url')
    .eq('id', portfolioId)
    .eq('factory_id', factory.id)
    .single()

  if (!portfolio) return { error: '포트폴리오를 찾을 수 없습니다.' }

  // image_url이 storage path인 경우 버킷에서도 삭제
  if (portfolio.image_url && !portfolio.image_url.startsWith('http')) {
    await supabase.storage.from('factory-portfolios').remove([portfolio.image_url])
  }

  const { error } = await supabase
    .from('factory_portfolios')
    .delete()
    .eq('id', portfolioId)
    .eq('factory_id', factory.id)
  if (error) return { error: `삭제 실패: ${error.message}` }

  revalidatePath('/factory/portfolios')
  revalidatePath('/portfolios')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 진행 사진 CRUD
// ─────────────────────────────────────────────────────────────

export async function addProgressPhoto(
  requestId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  // 참여(수락)한 요청에만 진행 사진 업로드 허용 — 임의 request_id 주입 차단(IDOR).
  const { data: membership } = await supabase
    .from('matches')
    .select('id')
    .eq('factory_id', factory.id)
    .eq('request_id', requestId)
    .eq('status', 'confirmed')
    .maybeSingle()
  if (!membership) return { error: '참여(수락)한 요청에만 진행 사진을 올릴 수 있습니다.' }

  const { error } = await supabase.from('progress_photos').insert({
    request_id: requestId,
    factory_id: factory.id,
    file_url: filePath,
    file_name: fileName,
    file_size: fileSize,
  })
  if (error) return { error: `사진 저장 실패: ${error.message}` }

  revalidatePath(`/factory/projects`)
  return {}
}

export async function deleteProgressPhoto(
  photoId: string,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { data: photo } = await supabase
    .from('progress_photos')
    .select('file_url')
    .eq('id', photoId)
    .eq('factory_id', factory.id)
    .single()

  if (!photo) return { error: '사진을 찾을 수 없습니다.' }

  await supabase.storage.from('progress-photos').remove([photo.file_url])

  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photoId)
    .eq('factory_id', factory.id)
  if (error) return { error: `삭제 실패: ${error.message}` }

  revalidatePath('/factory/projects')
  return {}
}

// ─────────────────────────────────────────────────────────────
// 공장 전문 분야(시공 분야) 태그 — Phase 7 선행 블로커
// ─────────────────────────────────────────────────────────────

/** 현재 로그인 공장이 선택한 전문 분야 목록 */
export async function getFactoryCategories(): Promise<CategoryKey[]> {
  const { supabase, factory } = await getAuthFactory()
  const { data } = await supabase
    .from('factory_categories')
    .select('category')
    .eq('factory_id', factory.id)
  return (data ?? [])
    .map((r) => r.category as string)
    .filter(isCategoryKey)
}

/**
 * 공장 전문 분야 집합을 교체한다(추가/삭제 diff).
 * 알 수 없는 카테고리 키는 무시. 본인 factory만 수정(getAuthFactory + RLS 이중 방어).
 */
export async function setFactoryCategories(
  categories: string[],
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const desired = new Set<string>(categories.filter(isCategoryKey))

  const { data: existingRows, error: readErr } = await supabase
    .from('factory_categories')
    .select('category')
    .eq('factory_id', factory.id)
  if (readErr) return { error: `저장 실패: ${readErr.message}` }

  const existing = new Set((existingRows ?? []).map((r) => r.category as string))
  const toAdd = [...desired].filter((c) => !existing.has(c))
  const toRemove = [...existing].filter((c) => !desired.has(c))

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('factory_categories')
      .delete()
      .eq('factory_id', factory.id)
      .in('category', toRemove)
    if (error) return { error: `저장 실패: ${error.message}` }
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('factory_categories')
      .insert(toAdd.map((category) => ({ factory_id: factory.id, category })))
    if (error) return { error: `저장 실패: ${error.message}` }
  }

  revalidatePath('/factory/categories')
  return {}
}

/**
 * 특정 분야를 시공하는 승인(active) 공장 id 목록 — Phase 7 분야별 매칭 데이터 소스.
 * 서버 액션/매칭 로직 전용(service client). 절대 클라이언트에 직접 노출 금지.
 */
export async function findFactoriesByCategory(category: string): Promise<string[]> {
  if (!isCategoryKey(category)) return []
  const db = createServiceClient()
  const { data } = await db
    .from('factory_categories')
    .select('factory_id, factories!inner(status)')
    .eq('category', category)
    .eq('factories.status', 'active')
  return (data ?? []).map((r) => r.factory_id as string)
}
