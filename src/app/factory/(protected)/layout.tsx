import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FactoryNav from './FactoryNav'
import Link from 'next/link'

export default async function FactoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData?.role) redirect('/onboarding')
  if (userData.role === 'customer') redirect('/customer')
  if (userData.role === 'admin') redirect('/admin')

  const { data: factory } = await supabase
    .from('factories')
    .select('id, status, company_name')
    .eq('user_id', user.id)
    .single()

  if (!factory) redirect('/factory/onboarding')
  if (factory.status === 'pending') redirect('/factory/pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Link href="/factory" className="text-lg font-bold text-gray-900">
              소핏
            </Link>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              파트너
            </span>
          </div>
          <span className="text-sm text-gray-600">{factory.company_name}</span>
        </div>
      </header>
      <FactoryNav />
      <main>{children}</main>
    </div>
  )
}
