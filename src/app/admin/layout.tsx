import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { loginHref } from '@/lib/auth/redirect'
import SidebarNav, { type SidebarNavItem } from '@/components/common/SidebarNav'
import Avatar from '@/components/ui/Avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import type { Notification } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(await loginHref())

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, avatar_url')
    .eq('id', user.id)
    .single()
  if (!userData?.role) redirect('/onboarding')
  if (userData.role === 'customer') redirect('/customer/me')
  if (userData.role === 'factory') redirect('/factory')
  if (userData.role !== 'admin') redirect('/login')

  const [{ count: pendingRequests }, { count: pendingFactories }, { data: notifications }] =
    await Promise.all([
      supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted'),
      supabase.from('factories').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length

  const navItems: SidebarNavItem[] = [
    { href: '/admin', label: '대시보드', exact: true },
    { href: '/admin/requests', label: '견적 요청', badge: pendingRequests ?? 0 },
    { href: '/admin/factories', label: '공장 관리', badge: pendingFactories ?? 0 },
    { href: '/admin/chats', label: '채팅' },
    { href: '/admin/users', label: '사용자' },
  ]

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-surface">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <Link href="/admin" className="text-base font-semibold text-ink">
            소핏 <span className="text-brand">관리자</span>
          </Link>
          <NotificationBell
            userId={user.id}
            initialUnreadCount={unreadCount}
            initialNotifications={(notifications ?? []) as Notification[]}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav items={navItems} />
        </div>
        <div className="border-t border-border px-4 py-3">
          <Link
            href="/admin/me"
            className="flex items-center gap-2.5 rounded-control p-1 transition-colors hover:bg-surface-muted"
          >
            <Avatar
              src={(userData.avatar_url as string | null) ?? null}
              name={userData.name ?? null}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {userData.name ?? user.email}
              </p>
              <p className="text-xs text-ink-subtle">관리자</p>
            </div>
          </Link>
          <div className="mt-2 flex items-center gap-3 pl-1">
            <Link href="/admin/me" className="text-xs text-ink-subtle hover:text-ink-muted">
              마이페이지
            </Link>
            <Link href="/" className="text-xs text-ink-subtle hover:text-ink-muted">
              홈으로
            </Link>
          </div>
        </div>
      </aside>

      {/* 메인 */}
      <main className="ml-56 flex-1">{children}</main>
    </div>
  )
}
