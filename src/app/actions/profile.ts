'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()

  if (!name) return { error: '이름을 입력해주세요.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('users')
    .update({ name, phone: phone || null })
    .eq('id', user.id)

  if (error) return { error: '프로필 저장에 실패했습니다.' }

  revalidatePath('/customer/me')
  revalidatePath('/factory/me')
  revalidatePath('/admin/me')
  return { success: true }
}

export async function updateMarketingConsent(
  value: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('users')
    .update({ marketing_consent: value })
    .eq('id', user.id)

  if (error) {
    // migration 008 미적용 시 컬럼 부재
    return { error: '동의 설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }
  }

  revalidatePath('/customer/me/account')
  return { success: true }
}
