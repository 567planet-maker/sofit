import { signInWithKakao, signInWithNaver } from '@/app/actions/auth'
import { EmailAuthForm } from './EmailAuthForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-brand">소핏</h1>
          <p className="mt-2 text-sm text-ink-muted">맞춤 쇼파 견적 중개 플랫폼</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-8 shadow-card">
          <h2 className="mb-6 text-center text-lg font-medium text-ink">
            로그인 / 회원가입
          </h2>

          <div className="flex flex-col gap-3">
            <form action={signInWithKakao}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-card bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-opacity hover:opacity-90"
              >
                <KakaoIcon />
                카카오로 시작하기
              </button>
            </form>

            <form action={signInWithNaver}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-card bg-[#03C75A] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <NaverIcon />
                네이버로 시작하기
              </button>
            </form>
          </div>

          <EmailAuthForm />

          <p className="mt-6 text-center text-xs text-ink-subtle">
            로그인 시{' '}
            <a href="/terms" className="underline">이용약관</a>
            {' '}및{' '}
            <a href="/privacy" className="underline">개인정보처리방침</a>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.582 1 1 3.895 1 7.455c0 2.28 1.52 4.282 3.808 5.413L3.9 16.1a.25.25 0 00.37.272L8.2 13.85c.264.024.531.037.8.037 4.418 0 8-2.895 8-6.432C17 3.895 13.418 1 9 1z"
        fill="#191919"
      />
    </svg>
  )
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M10.18 9.27L7.54 5H5v8h2.82V8.73L10.46 13H13V5h-2.82v4.27z"
        fill="white"
      />
    </svg>
  )
}
