import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { loginHref } from '@/lib/auth/redirect'

// 상태별 안내 카피 — active는 이 페이지에 머무르지 않고 /factory로 보냄.
const STATUS_COPY: Record<string, { icon: string; title: string; desc: string }> = {
  pending: {
    icon: '⏳',
    title: '심사 중입니다',
    desc: '관리자 확인 후 승인 안내를 드릴게요',
  },
  rejected: {
    icon: '🚫',
    title: '심사에서 반려되었습니다',
    desc: '자세한 사유는 알림을 확인해주세요. 문의가 필요하면 고객센터로 연락 바랍니다.',
  },
  suspended: {
    icon: '⛔',
    title: '이용이 정지되었습니다',
    desc: '계정이 일시 정지된 상태입니다. 문의가 필요하면 고객센터로 연락 바랍니다.',
  },
}

export default async function FactoryPendingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(await loginHref())

  const { data: factory } = await supabase
    .from('factories')
    .select('status')
    .eq('user_id', user.id)
    .single()

  // 공장 프로필이 없으면 온보딩으로, 이미 승인된 공장이면 대시보드로.
  if (!factory) redirect('/factory/onboarding')
  if (factory.status === 'active') redirect('/factory')

  const copy = STATUS_COPY[factory.status] ?? STATUS_COPY.pending

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">{copy.icon}</div>
        <h1 className="text-2xl font-semibold text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{copy.desc}</p>

        <div className="mt-10 flex flex-col gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-card border border-border bg-white py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              로그아웃
            </button>
          </form>

          <Link
            href="/me"
            className="block w-full rounded-card py-3 text-center text-sm text-ink-subtle hover:text-ink-muted"
          >
            계정 관리 (삭제)
          </Link>
        </div>
      </div>
    </div>
  )
}
