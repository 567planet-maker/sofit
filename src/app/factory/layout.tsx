import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function FactoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 공장 계정 확인
  const { data: factory } = await supabase
    .from('factories')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!factory) {
    redirect('/factory/onboarding')
  }

  if (factory.status === 'pending') {
    const isPendingPage = true // layout에서 경로 확인은 복잡하므로 페이지별로 처리
    void isPendingPage
  }

  return <>{children}</>
}
