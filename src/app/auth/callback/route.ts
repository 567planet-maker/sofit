import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { resolveNext } from '@/lib/auth/redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      const role = user.user_metadata?.role as string | undefined
      const next = cookieStore.get('auth_next')?.value ?? null
      const dest = resolveNext(next, role)
      const response = NextResponse.redirect(`${origin}${dest}`)
      response.cookies.delete('auth_next')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
