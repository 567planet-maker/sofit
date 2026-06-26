import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader, CardTitle, PageHeader, Badge } from '@/components/ui'
import ProfileForm from '@/components/account/ProfileForm'
import AccountActions from '@/components/account/AccountActions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function AdminMyPage() {
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
    <div className="mx-auto max-w-5xl p-7">
      <PageHeader title="마이페이지" description="관리자 계정을 관리합니다." />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* 메인 */}
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
        </div>

        {/* 사이드 */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">계정 정보</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-ink-subtle">회원 유형</span>
                <Badge tone="brand">관리자</Badge>
              </div>
              {profile?.created_at && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-ink-subtle">가입일</span>
                  <span className="font-medium text-ink">{formatDate(profile.created_at)}</span>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">계정 관리</CardTitle>
            </CardHeader>
            <CardBody>
              <AccountActions />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
