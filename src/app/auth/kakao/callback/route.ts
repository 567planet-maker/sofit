import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { resolveNext } from '@/lib/auth/redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (searchParams.get('error') || !code) {
    return NextResponse.redirect(new URL('/login?error=oauth', origin))
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
    console.error('[kakao/callback] token error:', tokens)
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
  return response
}
