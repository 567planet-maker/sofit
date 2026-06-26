import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader, CardTitle, Badge } from '@/components/ui'
import ProfileForm from '@/components/account/ProfileForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-2 py-1.5 text-sm">
      <span className="w-20 flex-shrink-0 text-ink-subtle">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

export default async function FactoryProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: factory }] = await Promise.all([
    supabase.from('users').select('name, email, phone, created_at').eq('id', user.id).single(),
    supabase
      .from('factories')
      .select('company_name, location, description, status, rating_avg, created_at')
      .eq('user_id', user.id)
      .single(),
  ])

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">담당자 프로필</CardTitle>
        </CardHeader>
        <CardBody>
          <ProfileForm
            email={profile?.email ?? user.email ?? null}
            name={profile?.name ?? null}
            phone={profile?.phone ?? null}
          />
        </CardBody>
      </Card>

      {factory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">공장 정보</CardTitle>
            <Link
              href="/factory/portfolios"
              className="text-xs font-medium text-brand hover:underline"
            >
              포트폴리오 관리 →
            </Link>
          </CardHeader>
          <CardBody>
            <Row label="업체명" value={factory.company_name} />
            <Row label="지역" value={factory.location} />
            <Row
              label="평점"
              value={factory.rating_avg ? `★ ${factory.rating_avg.toFixed(1)}` : null}
            />
            {factory.description && (
              <div className="mt-2 border-t border-border pt-3">
                <p className="mb-1 text-xs text-ink-subtle">소개</p>
                <p className="text-sm leading-relaxed text-ink-muted">{factory.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">계정 정보</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-subtle">회원 유형</span>
            <span className="font-medium text-ink">파트너 공장</span>
          </div>
          {factory?.status && (
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-subtle">승인 상태</span>
              <Badge tone={factory.status === 'active' ? 'success' : 'warning'}>
                {factory.status === 'active' ? '승인 완료' : factory.status}
              </Badge>
            </div>
          )}
          {(factory?.created_at ?? profile?.created_at) && (
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-subtle">가입일</span>
              <span className="font-medium text-ink">
                {formatDate((factory?.created_at ?? profile?.created_at) as string)}
              </span>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
