'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
