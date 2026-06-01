'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()
  if (!factory) redirect('/factory/onboarding')

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

  const { error } = await supabase
    .from('matches')
    .update({ status: 'confirmed' })
    .eq('id', matchId)
  if (error) return { error: `수락 처리 실패: ${error.message}` }

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

  const { error } = await supabase
    .from('matches')
    .update({ status: 'rejected', note: note ?? null })
    .eq('id', matchId)
  if (error) return { error: `거절 처리 실패: ${error.message}` }

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
  note?: string | null
}

// ─────────────────────────────────────────────────────────────
// 견적서 임시저장
// ─────────────────────────────────────────────────────────────

export async function saveQuoteDraft(
  matchId: string,
  data: QuoteInput,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  // 소유권 확인
  const { data: match } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('id', matchId)
    .eq('factory_id', factory.id)
    .single()
  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'confirmed') return { error: '수락된 요청에만 견적서를 작성할 수 있습니다.' }

  // 기존 draft 조회
  const { data: existing } = await supabase
    .from('factory_quotes')
    .select('id')
    .eq('match_id', matchId)
    .eq('status', 'draft')
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('factory_quotes')
      .update({ ...data, status: 'draft' })
      .eq('id', existing.id)
    if (error) return { error: '임시저장 실패' }
  } else {
    const { error } = await supabase
      .from('factory_quotes')
      .insert({ match_id: matchId, ...data, status: 'draft' })
    if (error) return { error: '임시저장 실패' }
  }

  revalidatePath(`/factory/requests/${match.request_id}`)
  return {}
}

// ─────────────────────────────────────────────────────────────
// 견적서 고객에게 제출
// ─────────────────────────────────────────────────────────────

export async function submitFactoryQuote(
  matchId: string,
  data: QuoteInput,
): Promise<{ error?: string }> {
  const { supabase, factory } = await getAuthFactory()

  const { data: match } = await supabase
    .from('matches')
    .select('id, request_id, status')
    .eq('id', matchId)
    .eq('factory_id', factory.id)
    .single()
  if (!match) return { error: '매칭 정보를 찾을 수 없습니다.' }
  if (match.status !== 'confirmed') return { error: '수락된 요청에만 견적서를 제출할 수 있습니다.' }

  // 기존 draft 삭제 후 submitted 레코드 insert
  await supabase
    .from('factory_quotes')
    .delete()
    .eq('match_id', matchId)
    .eq('status', 'draft')

  const { error: insertError } = await supabase
    .from('factory_quotes')
    .insert({ match_id: matchId, ...data, status: 'submitted' })
  if (insertError) return { error: `견적서 제출 실패: ${insertError.message}` }

  // quote_request 상태를 quote_arrived로 변경
  await supabase
    .from('quote_requests')
    .update({ status: 'quote_arrived' })
    .eq('id', match.request_id)
    .in('status', ['submitted', 'reviewing', 'matching'])

  // 고객 알림
  const { data: reqRow } = await supabase
    .from('quote_requests')
    .select('customer_id, site_name')
    .eq('id', match.request_id)
    .single()

  if (reqRow) {
    const { data: customerUser } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', reqRow.customer_id)
      .single()

    if (customerUser) {
      await supabase.from('notifications').insert({
        user_id: customerUser.user_id,
        type: 'quote_arrived',
        title: '견적서가 도착했습니다',
        body: `${reqRow.site_name} — ${factory.company_name}`,
        link: `/customer/requests/${match.request_id}/quotes`,
      })
    }
  }

  revalidatePath(`/factory/requests/${match.request_id}`)
  revalidatePath('/factory/requests')
  return {}
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
