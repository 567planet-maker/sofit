import Link from 'next/link'
import { signInWithKakao, signInWithNaver } from '@/app/actions/auth'
import { EmailAuthForm } from './EmailAuthForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined

  // 소셜 로그인은 서버 액션 form. 헤딩(모드에 따라 문구 변경)이 소셜 버튼 위에 있어
  // 클라이언트 컴포넌트인 EmailAuthForm에 slot으로 주입한다. page.tsx는 서버 컴포넌트 유지.
  const social = (
    <div className="flex flex-col gap-2">
      <form action={signInWithKakao}>
        {safeNext && <input type="hidden" name="next" value={safeNext} />}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-[9px] rounded-card bg-[#FEE500] text-sm font-bold text-[#191919] transition-[filter,transform] duration-100 hover:brightness-[.96] active:translate-y-px"
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>
      </form>

      <form action={signInWithNaver}>
        {safeNext && <input type="hidden" name="next" value={safeNext} />}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-[9px] rounded-card bg-[#03C75A] text-sm font-bold text-white transition-[filter,transform] duration-100 hover:brightness-[.94] active:translate-y-px"
        >
          <NaverIcon />
          네이버로 시작하기
        </button>
      </form>
    </div>
  )

  return (
    <div className="grid min-h-screen grid-cols-1 min-[861px]:grid-cols-[minmax(320px,40%)_1fr]">
      {/* ── Left: brand panel (≤860px 숨김) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand px-11 pb-7 pt-9 text-white min-[861px]:flex">
        {/* soft radial glows */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(560px 420px at 12% 100%, rgba(255,255,255,.14), transparent 60%), radial-gradient(480px 480px at 100% 0%, rgba(255,255,255,.10), transparent 55%)',
          }}
        />
        {/* faint masked dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent, rgba(0,0,0,.7) 55%, transparent 100%)',
            maskImage:
              'linear-gradient(180deg, transparent, rgba(0,0,0,.7) 55%, transparent 100%)',
          }}
        />

        <div className="relative text-[22px] font-extrabold tracking-[-.02em]">소핏</div>

        <div className="relative my-auto">
          <h2 className="m-0 text-[28px] font-extrabold leading-[1.3] tracking-[-.03em]">
            인테리어의 모든 공정,
            <br />
            검증된 공장과 함께
          </h2>
          <p className="mt-3 max-w-[340px] text-[14.5px] font-medium leading-[1.6] text-white/[.78]">
            현장 정보만 입력하면 검증된 공장들이 견적을 보냅니다. 여러 견적을 비교하고 가장 좋은
            조건으로 진행하세요.
          </p>
          <ul className="mt-[22px] flex list-none flex-col gap-2.5 p-0">
            {['실측부터 시공까지 한 번에', '검증된 공장만 매칭', '여러 견적 비교, 투명한 가격'].map(
              (label) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 text-[14.5px] font-semibold text-white/[.92]"
                >
                  <CheckCircle />
                  {label}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="relative text-[12.5px] font-medium text-white/[.56]">© 2026 SOFIT</div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto p-6 min-[861px]:px-8 min-[861px]:py-5">
        <Link
          href="/"
          className="absolute left-6 top-[18px] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-muted transition-colors hover:text-ink min-[861px]:left-8"
        >
          <ChevronLeft className="h-[15px] w-[15px]" />
          홈으로
        </Link>

        <div className="w-full max-w-[376px]">
          {/* 모바일 전용 로고 (≤860px, 숨겨진 브랜드 패널 대체) */}
          <div className="mb-[18px] block text-center min-[861px]:hidden">
            <div className="text-[21px] font-extrabold tracking-[-.02em] text-brand">소핏</div>
            <div className="mt-1.5 text-[13.5px] font-medium text-ink-muted">
              인테리어의 모든 공정, 검증된 공장 매칭
            </div>
          </div>

          <EmailAuthForm next={safeNext} social={social} />

          <p className="mt-3.5 text-center text-[11.5px] leading-[1.55] text-ink-subtle">
            로그인 시{' '}
            <a href="/terms" className="text-ink-muted underline underline-offset-2">
              이용약관
            </a>{' '}
            및{' '}
            <a href="/privacy" className="text-ink-muted underline underline-offset-2">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>

          <div className="mt-3 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-none">
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-none">
      <path d="M10.18 9.27L7.54 5H5v8h2.82V8.73L10.46 13H13V5h-2.82v4.27z" fill="white" />
    </svg>
  )
}

function CheckCircle() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] flex-none">
      <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,.5)" />
      <path
        d="M6 10.2l2.6 2.6L14.2 7"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.5 15.5L7 10l5.5-5.5" />
    </svg>
  )
}
