import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SidebarNav, { type SidebarNavItem } from '@/components/common/SidebarNav'
import NotificationBell from '@/components/notifications/NotificationBell'
import type { Notification } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()
  if (!userData?.role) redirect('/onboarding')
  if (userData.role === 'customer') redirect('/customer')
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
        <div className="border-t border-border px-5 py-3">
          <Link
            href="/admin/me"
            className="block text-xs font-medium text-ink-muted hover:text-ink"
          >
            {userData.name ?? user.email}
          </Link>
          <div className="mt-1 flex items-center gap-3">
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
