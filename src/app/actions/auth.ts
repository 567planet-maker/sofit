'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

async function getOrigin() {
  const headersList = await headers()
  return headersList.get('origin') ?? ''
}

export async function signInWithKakao() {
  const origin = await getOrigin()
  const clientId = process.env.KAKAO_REST_API_KEY!

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/auth/kakao/callback`,
    response_type: 'code',
    scope: 'profile_nickname profile_image openid',
    prompt: 'login',
  })

  redirect(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

export async function signInWithNaver() {
  const supabase = await createClient()
  const origin = await getOrigin()

  // Naver: Supabase Dashboard > Authentication > Providers > Add Custom OIDC
  // Provider Slug: "naver" 로 등록 후 동작
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'naver' as Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider'],
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect('/login?error=oauth')
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.auth.admin.deleteUser(user!.id)
  redirect('/login')
}

export async function signUpWithEmail(
  _: { error?: string; message?: string } | null,
  formData: FormData
): Promise<{ error?: string; message?: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' }
  if (password.length < 8) return { error: '비밀번호는 8자 이상이어야 합니다.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      return { error: '이미 가입된 이메일입니다. 로그인을 시도해보세요.' }
    }
    if (msg.includes('email') && msg.includes('disabled')) {
      return { error: 'Supabase 대시보드에서 이메일 로그인을 활성화해주세요.' }
    }
    if (msg.includes('password')) {
      return { error: `비밀번호 오류: ${error.message}` }
    }
    if (msg.includes('rate limit') || msg.includes('only request this once')) {
      return { error: '잠시 후 다시 시도해주세요. (60초 제한)' }
    }
    return { error: `오류: ${error.message}` }
  }

  if (data.session) redirect('/onboarding')

  return { message: '인증 메일을 발송했습니다. 이메일을 확인해주세요.' }
}

export async function signInWithEmail(
  _: { error?: string; message?: string } | null,
  formData: FormData
): Promise<{ error?: string; message?: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }

  const role = data.user.user_metadata?.role as string | undefined

  if (!role) redirect('/onboarding')
  if (role === 'admin') redirect('/admin')
  if (role === 'factory') redirect('/factory')
  redirect('/customer')
}

export async function updateUserRole(role: UserRole) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  await supabase.auth.updateUser({ data: { role } })
  await supabase.from('users').update({ role }).eq('id', user!.id)

  if (role === 'factory') redirect('/factory/onboarding')
  redirect('/customer')
}
