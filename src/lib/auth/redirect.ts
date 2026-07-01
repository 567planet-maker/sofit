import { headers } from 'next/headers'

/** 미들웨어가 주입한 현재 경로를 next 로 담은 /login URL (보호 라우트에서 미인증 시) */
export async function loginHref(): Promise<string> {
  const path = (await headers()).get('x-pathname')
  return path ? `/login?next=${encodeURIComponent(path)}` : '/login'
}

/**
 * 로그인/인증 후 목적지 — 유효한 next(딥링크)가 있으면 그곳, 없으면 홈('/').
 * 신규 가입자는 DB 트리거(handle_new_user)로 이미 customer 역할이 부여되므로
 * 별도 온보딩 단계 없이 곧바로 홈으로 보낸다.
 */
export function resolveNext(
  next: string | null | undefined,
  _role?: string | null | undefined,
): string {
  if (
    next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/login') &&
    !next.startsWith('/auth')
  ) {
    return next
  }
  return '/'
}
