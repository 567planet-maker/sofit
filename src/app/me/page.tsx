import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** 역할별 마이페이지로 리다이렉트 */
export default async function MePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (data?.role === 'admin') redirect('/admin/me')
  if (data?.role === 'factory') redirect('/factory/me')
  redirect('/customer/me')
}
