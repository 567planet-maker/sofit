import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { resolveNext } from '@/lib/auth/redirect'
import { logSecurityEvent } from '@/lib/security-log'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (searchParams.get('error') || !code) {
    return NextResponse.redirect(new URL('/login?error=oauth', origin))
  }

  // CSRF 방지: 시작 시 발급한 state 쿠키와 콜백 state 파라미터를 대조.
  const returnedState = searchParams.get('state')
  const cookieState = request.cookies.get('kakao_oauth_state')?.value
  if (!returnedState || !cookieState || returnedState !== cookieState) {
    // CSRF 위조 시도 가능성 — 보안 이벤트로 기록.
    await logSecurityEvent('oauth_state_mismatch', {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      detail: { provider: 'kakao', hadReturnedState: !!returnedState, hadCookieState: !!cookieState },
    })
    const res = NextResponse.redirect(new URL('/login?error=oauth_state', origin))
    res.cookies.delete('kakao_oauth_state')
    return res
  }

  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY!,
      redirect_uri: `${origin}/auth/kakao/callback`,
      code,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.id_token) {
    // 토큰 응답 전체(access_token 등) 로깅 금지 — 에러 코드/설명만 남긴다.
    console.error('[kakao/callback] token error:', {
      error: tokens?.error,
      error_description: tokens?.error_description,
    })
    return NextResponse.redirect(new URL('/login?error=oauth', origin))
  }

  type CookieArgs = Parameters<typeof NextResponse.prototype.cookies.set>
  const pendingCookies: CookieArgs[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push([name, value, options])
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'kakao',
    token: tokens.id_token,
  })

  if (error || !data.user) {
    console.error('[kakao/callback] signInWithIdToken error:', error)
    return NextResponse.redirect(new URL('/login?error=oauth', origin))
  }

  const role = data.user.user_metadata?.role as string | undefined
  const next = request.cookies.get('auth_next')?.value ?? null
  const dest = resolveNext(next, role)

  const response = NextResponse.redirect(new URL(dest, origin))
  pendingCookies.forEach((args) => response.cookies.set(...args))
  response.cookies.delete('auth_next')
  response.cookies.delete('kakao_oauth_state')
  return response
}
