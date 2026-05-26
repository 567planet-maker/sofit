import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isCustomerRoute = pathname.startsWith('/customer')
  const isFactoryRoute = pathname.startsWith('/factory')
  const isAdminRoute = pathname.startsWith('/admin')
  const isProtectedRoute = isCustomerRoute || isFactoryRoute || isAdminRoute

  // 비인증 사용자 → /login 리디렉트
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isProtectedRoute && user) {
    const role = user.user_metadata?.role as UserRole | undefined

    // 역할 미설정 사용자 → 역할 선택 페이지
    if (!role && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // 잘못된 역할로 보호된 라우트 접근 차단
    if (role === 'customer' && (isFactoryRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/customer', request.url))
    }
    if (role === 'factory' && (isCustomerRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/factory', request.url))
    }
    if (role === 'admin' && (isCustomerRoute || isFactoryRoute)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}
