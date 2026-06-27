import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginHref } from '@/lib/auth/redirect'
import Header from '@/components/Header'

export default async function FactoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(await loginHref())

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData?.role) redirect('/onboarding')
  if (userData.role === 'customer') redirect('/customer/me')
  if (userData.role === 'admin') redirect('/admin')

  const { data: factory } = await supabase
    .from('factories')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!factory) redirect('/factory/onboarding')
  if (factory.status === 'pending') redirect('/factory/pending')

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main>{children}</main>
    </div>
  )
}
