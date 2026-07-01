'use server'

import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resolveNext } from '@/lib/auth/redirect'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { logSecurityEvent, maskEmail } from '@/lib/security-log'

async function getOrigin() {
  const headersList = await headers()
  return headersList.get('origin') ?? ''
}

/** 로그인 후 복귀할 경로를 쿠키에 저장 (OAuth 라운드트립 동안 유지) */
async function stashNext(formData: FormData) {
  const next = formData.get('next')
  const cookieStore = await cookies()
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    cookieStore.set('auth_next', next, { httpOnly: true, path: '/', maxAge: 600 })
  } else {
    cookieStore.delete('auth_next')
  }
}

export async function signInWithKakao(formData: FormData) {
  await stashNext(formData)
  const origin = await getOrigin()
  const clientId = process.env.KAKAO_REST_API_KEY!

  // CSRF 방지: state 발급 → httpOnly 쿠키 저장, authorize URL에 동봉.
  //   콜백에서 returned state == 쿠키 state 를 대조한다.
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('kakao_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax', // 카카오에서 돌아오는 top-level 네비게이션에 쿠키 전송 허용
    path: '/',
    maxAge: 600,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/auth/kakao/callback`,
    response_type: 'code',
    scope: 'profile_nickname profile_image openid',
    prompt: 'login',
    state,
  })

  redirect(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

export async function signInWithNaver(formData: FormData) {
  await stashNext(formData)
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
  const name = ((formData.get('name') as string) ?? '').trim()
  const agreed = formData.get('agreed')

  if (!name) return { error: '이름을 입력해주세요.' }
  if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' }
  if (password.length < 8) return { error: '비밀번호는 8자 이상이어야 합니다.' }
  if (agreed !== 'on') return { error: '이용약관 및 개인정보처리방침에 동의해주세요.' }

  // 가입 스팸 방어: IP당 10분에 5회
  const ip = await getClientIp()
  if (!(await checkRateLimit('signup_ip', ip, 5, 600))) {
    return { error: '가입 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

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

  // 가입 즉시 세션이 생기면(이메일 확인 비활성) 곧바로 홈으로.
  // 신규 사용자는 DB 트리거로 이미 customer 역할이 부여된 상태.
  if (data.session) redirect('/')

  return { message: '인증 메일을 발송했습니다. 이메일을 확인해주세요.' }
}

export async function signInWithEmail(
  _: { error?: string; message?: string } | null,
  formData: FormData
): Promise<{ error?: string; message?: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' }

  // Brute force 방어: 이메일당 5분에 8회, IP당 5분에 30회
  const ip = await getClientIp()
  const emailKey = email.trim().toLowerCase()
  const [emailOk, ipOk] = await Promise.all([
    checkRateLimit('login_email', emailKey, 8, 300),
    checkRateLimit('login_ip', ip, 30, 300),
  ])
  if (!emailOk || !ipOk) {
    return { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // 인증 실패 별도 추적(brute force 탐지). 이메일은 마스킹해 기록.
    await logSecurityEvent('login_failed', { identity: maskEmail(emailKey), ip })
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  const role = data.user.user_metadata?.role as string | undefined
  const next = formData.get('next') as string | null
  redirect(resolveNext(next, role))
}

