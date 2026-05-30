import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import HeaderShell from '@/components/HeaderShell'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    role = data?.role ?? null
  }

  return (
    <HeaderShell>
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          소핏
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-500 sm:flex">
          <Link href="/portfolios" className="transition-colors hover:text-gray-900">
            포트폴리오
          </Link>
          {user && role === 'customer' && (
            <Link href="/customer" className="transition-colors hover:text-gray-900">
              내 견적
            </Link>
          )}
          {user && role === 'factory' && (
            <Link href="/factory" className="transition-colors hover:text-gray-900">
              공장 대시보드
            </Link>
          )}
          {user && role === 'admin' && (
            <Link href="/admin" className="transition-colors hover:text-gray-900">
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                로그아웃
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
