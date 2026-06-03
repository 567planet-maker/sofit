import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'

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

  const [{ count: pendingRequests }, { count: pendingFactories }] = await Promise.all([
    supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase.from('factories').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center border-b border-gray-100 px-5">
          <Link href="/admin" className="text-base font-bold text-gray-900">
            소핏 관리자
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav
            pendingRequests={pendingRequests ?? 0}
            pendingFactories={pendingFactories ?? 0}
          />
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">{userData.name ?? user.email}</p>
          <Link href="/" className="mt-1 block text-xs text-gray-400 hover:text-gray-600">
            홈으로
          </Link>
        </div>
      </aside>

      {/* 메인 */}
      <main className="ml-56 flex-1">{children}</main>
    </div>
  )
}
