import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui'
import ProfileForm from '@/components/account/ProfileForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function CustomerProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, phone, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">프로필 정보</CardTitle>
        </CardHeader>
        <CardBody>
          <ProfileForm
            email={profile?.email ?? user.email ?? null}
            name={profile?.name ?? null}
            phone={profile?.phone ?? null}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">계정 정보</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-ink-subtle">회원 유형</span>
            <span className="font-medium text-ink">고객</span>
          </div>
          {profile?.created_at && (
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-ink-subtle">가입일</span>
              <span className="font-medium text-ink">{formatDate(profile.created_at)}</span>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
