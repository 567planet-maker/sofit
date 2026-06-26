import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
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
  if (userData.role === 'factory') redirect('/factory')
  if (userData.role === 'admin') redirect('/admin')

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main>{children}</main>
    </div>
  )
}
