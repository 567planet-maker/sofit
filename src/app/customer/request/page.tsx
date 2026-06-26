import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import QuoteRequestForm from './QuoteRequestForm'

export const metadata: Metadata = {
  title: '견적 요청',
  description: '쇼파·빌트인 견적을 요청하세요. 소핏이 검증된 공장과 연결해드립니다.',
}

export default async function QuoteRequestPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/customer/request')

  // 고객 역할 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role && userData.role !== 'customer') {
    redirect(`/${userData.role}`)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-muted">
        <div className="border-b border-border bg-white px-4 py-5">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold text-ink">견적 요청</h1>
            <p className="mt-1 text-sm text-ink-muted">
              아래 폼을 작성하시면 소핏 담당자가 영업일 기준 1~2일 내 연락드립니다.
            </p>
          </div>
        </div>
        <QuoteRequestForm />
      </main>
    </>
  )
}
