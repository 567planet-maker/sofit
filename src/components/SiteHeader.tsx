import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { loginHref } from '@/lib/auth/redirect'
import NotificationBell from '@/components/notifications/NotificationBell'
import ProfileMenu from '@/components/ProfileMenu'
import SiteHeaderShell from '@/components/SiteHeaderShell'
import type { Notification } from '@/types'

/**
 * 사이트 공통 헤더 (단일 소스). 랜딩·고객·공장·업체찾기 등 모든 곳에서 동일하게 사용한다.
 * 여기 하나만 고치면 전 페이지 헤더가 함께 바뀐다.
 * - variant="landing": 랜딩용(높이 넓게)
 * - variant="app": 마이페이지·공장관리 등(높이 compact) — 위치·좌우 간격은 랜딩과 동일
 * 섹션 네비는 어느 페이지에서든 랜딩 섹션으로 이동하도록 절대경로(/#...)를 쓴다.
 */
export default async function SiteHeader({
  variant = 'app',
}: {
  variant?: 'landing' | 'app'
} = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  let name: string | null = null
  let avatarUrl: string | null = null
  let notifications: Notification[] = []
  let unreadCount = 0
  if (user) {
    const [{ data: userData }, { data: notis }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    role = userData?.role ?? null
    name = (userData?.name as string | null) ?? null
    avatarUrl = (userData?.avatar_url as string | null) ?? null
    notifications = (notis ?? []) as Notification[]
    unreadCount = notifications.filter((n) => !n.read_at).length
  }

  const chatHref =
    role === 'customer' ? '/customer/chat' : role === 'factory' ? '/factory/chat' : null
  const mypageHref =
    role === 'admin' ? '/admin/me' : role === 'factory' ? '/factory/me' : '/customer/me'

  const loginUrl = user ? '/login' : await loginHref()

  return (
    <SiteHeaderShell compact={variant !== 'landing'}>
      <div className="nav-inner">
        <div className="nav-left">
          <Link href="/" className="logo">
            SO<b>FIT</b>
          </Link>
          {user && role !== 'factory' && role !== 'admin' && (
            <div className="nav-actions">
              <Link href="/customer/request/new" className="btn btn-md btn-primary">
                견적 요청하기
              </Link>
              <Link href="/factory/onboarding" className="btn btn-md btn-ghost">
                공장 등록하기
              </Link>
            </div>
          )}
        </div>

        <nav className="nav-links">
          <a href="/#problem">왜 소핏인가</a>
          <a href="/#features">서비스</a>
          <a href="/#cases">작업 사례</a>
          <a href="/#partner">공장 입점</a>
          <Link href="/portfolios">업체찾기</Link>
        </nav>

        <div className="nav-cta">
          {user ? (
            <div className="nav-tools">
              {role === 'customer' && (
                <Link href="/customer/me/requests" className="nav-login hidden sm:inline">
                  내 견적관리
                </Link>
              )}
              {role === 'factory' && (
                <Link href="/factory" className="nav-login hidden sm:inline">
                  내 공장관리
                </Link>
              )}
              {role === 'admin' && (
                <Link href="/admin" className="nav-login hidden sm:inline">
                  관리자
                </Link>
              )}
              {chatHref && (
                <Link
                  href={chatHref}
                  aria-label="채팅"
                  className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                  </svg>
                </Link>
              )}
              <NotificationBell
                userId={user.id}
                initialUnreadCount={unreadCount}
                initialNotifications={notifications}
              />
              <ProfileMenu name={name} avatarUrl={avatarUrl} mypageHref={mypageHref} />
            </div>
          ) : (
            <>
              <Link href={loginUrl} className="nav-login">
                로그인
              </Link>
              <Link href="/customer/request/new" className="btn btn-md btn-primary">
                견적 요청하기
              </Link>
            </>
          )}
        </div>
      </div>
    </SiteHeaderShell>
  )
}
