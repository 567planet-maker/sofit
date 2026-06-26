import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui'
import ConsentSettings from '@/components/account/ConsentSettings'
import AccountActions from '@/components/account/AccountActions'

export default async function FactoryAccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // migration 008 미적용 환경에서도 깨지지 않도록 방어적으로 조회
  let marketingConsent = false
  const { data } = await supabase
    .from('users')
    .select('marketing_consent')
    .eq('id', user.id)
    .single()
  if (data && typeof (data as { marketing_consent?: boolean }).marketing_consent === 'boolean') {
    marketingConsent = (data as { marketing_consent: boolean }).marketing_consent
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">개인정보 처리 동의</CardTitle>
        </CardHeader>
        <CardBody>
          <ConsentSettings initialMarketing={marketingConsent} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">로그아웃 · 회원 탈퇴</CardTitle>
        </CardHeader>
        <CardBody>
          <AccountActions />
        </CardBody>
      </Card>
    </div>
  )
}
