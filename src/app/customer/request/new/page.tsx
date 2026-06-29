import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createDraft } from '@/app/actions/quote-request'

// "견적 요청" 진입 → 항상 새 견적(빈 draft)을 만들고 편집 화면으로 이동.
// (기존 임시저장 이어쓰기는 마이페이지 > 내 견적 현황에서만)
export default async function NewQuoteRequestPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/customer/request/new')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (userData?.role && userData.role !== 'customer') redirect(`/${userData.role}`)

  const draft = await createDraft()
  if ('error' in draft) redirect('/login?redirect=/customer/request/new')

  redirect(`/customer/request/${draft.requestId}`)
}
