import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NotificationBell from '@/components/notifications/NotificationBell'
import type { Notification } from '@/types'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
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
  if (userData.role === 'factory') redirect('/factory')
  if (userData.role === 'admin') redirect('/admin')

  // 알림 데이터 (최근 10개)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-gray-900">
            소핏
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/customer/requests" className="text-gray-600 hover:text-gray-900">
              내 견적
            </Link>
            <Link href="/customer/chat" className="text-gray-600 hover:text-gray-900">
              채팅
            </Link>
            <NotificationBell
              userId={user.id}
              initialUnreadCount={unreadCount}
              initialNotifications={(notifications ?? []) as Notification[]}
            />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
