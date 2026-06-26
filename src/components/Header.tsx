import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderShell from '@/components/HeaderShell'
import NotificationBell from '@/components/notifications/NotificationBell'
import type { Notification } from '@/types'

export default async function Header({ contained = false }: { contained?: boolean } = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  let notifications: Notification[] = []
  let unreadCount = 0
  if (user) {
    const [{ data: userData }, { data: notis }] = await Promise.all([
      supabase.from('users').select('role').eq('id', user.id).single(),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    role = userData?.role ?? null
    notifications = (notis ?? []) as Notification[]
    unreadCount = notifications.filter((n) => !n.read_at).length
  }

  const chatHref =
    role === 'customer' ? '/customer/chat' : role === 'factory' ? '/factory/chat' : null

  return (
    <HeaderShell>
      <div
        className={
          contained
            ? 'mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3'
            : 'flex items-center justify-between py-3 pl-5 pr-[max(1.25rem,calc((100vw_-_80rem)/2_+_1rem))]'
        }
      >
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand">
          소핏
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-ink-muted">
          <Link href="/portfolios" className="hidden transition-colors hover:text-ink sm:inline">
            업체찾기
          </Link>
          {user && role === 'customer' && (
            <Link href="/customer/me" className="hidden transition-colors hover:text-ink sm:inline">
              마이페이지
            </Link>
          )}
          {user && role === 'factory' && (
            <>
              <Link href="/factory/me" className="hidden transition-colors hover:text-ink sm:inline">
                마이페이지
              </Link>
              <Link href="/factory" className="hidden transition-colors hover:text-ink sm:inline">
                공장관리
              </Link>
            </>
          )}
          {user && role === 'admin' && (
            <Link href="/admin" className="hidden transition-colors hover:text-ink sm:inline">
              관리자
            </Link>
          )}
          {user ? (
            <>
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
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-control bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand-hover"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </HeaderShell>
  )
}
