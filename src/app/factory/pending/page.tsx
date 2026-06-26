import { signOut } from '@/app/actions/auth'
import Link from 'next/link'

export default function FactoryPendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">⏳</div>
        <h1 className="text-2xl font-semibold text-ink">심사 중입니다</h1>
        <p className="mt-2 text-sm text-ink-muted">
          관리자 확인 후 승인 안내를 드릴게요
        </p>

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
