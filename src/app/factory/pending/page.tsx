import { signOut } from '@/app/actions/auth'
import Link from 'next/link'

export default function FactoryPendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-5xl">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900">심사 중입니다</h1>
        <p className="mt-2 text-sm text-gray-500">
          관리자 확인 후 승인 안내를 드릴게요
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>

          <Link
            href="/me"
            className="block w-full rounded-xl py-3 text-center text-sm text-gray-400 hover:text-gray-600"
          >
            계정 관리 (삭제)
          </Link>
        </div>
      </div>
    </div>
  )
}
