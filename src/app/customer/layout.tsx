import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginHref } from '@/lib/auth/redirect'
import SiteHeader from '@/components/SiteHeader'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
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

  if (!userData?.role) redirect('/')
  if (userData.role === 'factory') redirect('/factory')
  if (userData.role === 'admin') redirect('/admin')

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader variant="app" />
      <main>{children}</main>
    </div>
  )
}
