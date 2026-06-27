import { headers } from 'next/headers'

/** 미들웨어가 주입한 현재 경로를 next 로 담은 /login URL (보호 라우트에서 미인증 시) */
export async function loginHref(): Promise<string> {
  const path = (await headers()).get('x-pathname')
  return path ? `/login?next=${encodeURIComponent(path)}` : '/login'
}

/** 역할별 기본 홈 (next 가 없을 때) */
export function roleHome(role?: string | null): string {
  if (role === 'admin') return '/admin'
  if (role === 'factory') return '/factory'
  if (role === 'customer') return '/customer/me'
  return '/onboarding'
}

/** 로그인 후 목적지 결정 — 역할 없으면 온보딩, 유효한 next 있으면 그곳, 아니면 역할 홈 */
export function resolveNext(
  next: string | null | undefined,
  role: string | null | undefined,
): string {
  if (!role) return '/onboarding'
  if (
    next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/login') &&
    !next.startsWith('/auth') &&
    next !== '/onboarding'
  ) {
    return next
  }
  return roleHome(role)
}
