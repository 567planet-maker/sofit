# 로그인 페이지 리디자인 브리프 (소핏 / SOFIT)

> 이 문서 하나만 클로드에게 넘기면 됩니다. 아래 코드/토큰/제약을 그대로 복붙하세요.

---

## 0. 요청 (프롬프트로 사용)

소핏(SOFIT) 로그인 페이지를 **리디자인**해줘.

- 스택: **Next.js (App Router, 서버 컴포넌트) + Tailwind CSS v4**. `page.tsx`는 `async` 서버 컴포넌트다.
- **디자인 토큰만 사용**할 것. 임의 hex 색(`#3B82F6` 등) 쓰지 말고 아래 정의된 토큰 클래스(`bg-brand`, `text-ink`, `rounded-card` 등)만 써라.
- 방향(톤): **현재 톤 유지·개선**. Stripe식 절제된 카드 레이아웃과 브랜드 블루(#0064FF)를 유지하되, 완성도·여백·위계·마이크로 인터랙션을 다듬어라. 레이아웃을 통째로 뒤엎지 말 것.
- 아래 **"바꾸면 안 되는 것"의 기능적 구조(서버 액션 form, hidden input, 컴포넌트 시그니처)를 그대로 보존**할 것. 마크업/클래스/구성만 바꿔라.
- 결과물: `src/app/login/page.tsx` 전체 코드. (필요하면 `EmailAuthForm.tsx`도 함께.)

---

## 1. 디자인 토큰 (globals.css `@theme` — 이것만 사용)

```css
/* Brand (SOFIT Blue #0064FF 단일 통일) */
--color-brand: #0064FF;
--color-brand-hover: #004FCC;
--color-brand-active: #003D99;
--color-brand-tint: #E8F1FF;
--color-brand-tint-strong: #C9DEFF;

/* Neutral surface scale */
--color-ink: #1A1F36;         /* 본문/제목 */
--color-ink-muted: #4F566B;   /* 보조 텍스트 */
--color-ink-subtle: #8792A2;  /* 캡션/약관 */
--color-canvas: #F6F8FB;      /* 페이지 배경 */
--color-surface: #FFFFFF;     /* 카드 배경 */
--color-surface-muted: #F0F3F8;
--color-border: #E3E8EE;
--color-border-strong: #D5DBE3;

/* Semantic */
--color-success: #1A7F64;
--color-danger: #E5484D;

/* Radius (Stripe식 절제된 둥글기) */
--radius-card: 0.625rem;    /* 10px — 카드/패널  → rounded-card */
--radius-control: 0.375rem; /* 6px  — 버튼/입력  → rounded-control */
--radius-pill: 9999px;      /* → rounded-pill */

/* Shadow */
--shadow-card: 0 1px 1px rgb(0 0 0 / 0.03), 0 2px 5px rgb(26 31 54 / 0.06); /* → shadow-card */
--shadow-card-hover: 0 4px 14px rgb(26 31 54 / 0.10);
--shadow-pop: 0 8px 28px rgb(26 31 54 / 0.14);
```

- Tailwind v4라 위 토큰은 `bg-brand`, `text-ink-muted`, `border-border`, `rounded-card`, `shadow-card` 형태의 유틸리티로 바로 쓸 수 있음.
- 폰트: **Pretendard** (전역 적용됨, 따로 지정 불필요).

---

## 2. 현재 로그인 페이지 코드 (기준점)

### `src/app/login/page.tsx`

```tsx
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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-semibold tracking-tight text-brand transition-opacity hover:opacity-80"
          >
            소핏
          </Link>
          <p className="mt-2 text-sm text-ink-muted">인테리어의 모든 공정, 검증된 공장 매칭</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-8 shadow-card">
          <h2 className="mb-6 text-center text-lg font-medium text-ink">로그인 / 회원가입</h2>

          <div className="flex flex-col gap-3">
            <form action={signInWithKakao}>
              {safeNext && <input type="hidden" name="next" value={safeNext} />}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-card bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-opacity hover:opacity-90"
              >
                <KakaoIcon />
                카카오로 시작하기
              </button>
            </form>

            <form action={signInWithNaver}>
              {safeNext && <input type="hidden" name="next" value={safeNext} />}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-card bg-[#03C75A] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <NaverIcon />
                네이버로 시작하기
              </button>
            </form>
          </div>

          <EmailAuthForm next={safeNext} />

          <p className="mt-6 text-center text-xs text-ink-subtle">
            로그인 시{' '}
            <a href="/terms" className="underline">이용약관</a>
            {' '}및{' '}
            <a href="/privacy" className="underline">개인정보처리방침</a>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            ← 홈으로 돌아가기
          </Link>
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
```

### `src/app/login/EmailAuthForm.tsx` (클라이언트 컴포넌트)

- 요약: **로그인/회원가입 탭 토글**(useState) + 각각 서버 액션 form. 로그인 `signInWithEmail` / 회원가입 `signUpWithEmail` (둘 다 `useActionState`). 회원가입 폼엔 **약관 동의 체크박스(필수)**. 에러 `text-danger` / 성공 `text-success`.

```tsx
'use client'

import { useActionState, useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth'

function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <input
        name="email"
        type="email"
        placeholder="이메일"
        required
        autoComplete="email"
        className="rounded-card border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        required
        autoComplete="current-password"
        className="rounded-card border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      {state?.error && (
        <p className="text-center text-xs text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-control bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {pending ? '로그인 중...' : '이메일로 로그인'}
      </button>
    </form>
  )
}

function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUpWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <input
        name="name"
        type="text"
        placeholder="이름"
        required
        autoComplete="name"
        className="rounded-card border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      <input
        name="email"
        type="email"
        placeholder="이메일"
        required
        autoComplete="email"
        className="rounded-card border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호 (8자 이상)"
        required
        minLength={8}
        autoComplete="new-password"
        className="rounded-card border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      <label className="flex cursor-pointer items-start gap-2.5 px-1 text-left">
        <input
          name="agreed"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-brand"
        />
        <span className="text-xs text-ink-muted">
          <a href="/terms" target="_blank" className="font-medium underline">이용약관</a>
          {' '}및{' '}
          <a href="/privacy" target="_blank" className="font-medium underline">개인정보처리방침</a>
          에 동의합니다. <span className="text-danger">(필수)</span>
        </span>
      </label>
      {state?.error && (
        <p className="text-center text-xs text-danger">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-center text-xs text-success">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-card bg-ink py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '가입 중...' : '이메일로 회원가입'}
      </button>
    </form>
  )
}

export function EmailAuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-ink-subtle">또는</span>
        </div>
      </div>

      <div className="mb-4 flex rounded-card bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-white text-ink shadow-card'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-white text-ink shadow-card'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          회원가입
        </button>
      </div>

      {mode === 'login' ? <LoginForm next={next} /> : <SignupForm next={next} />}
    </div>
  )
}
```

---

## 3. 바꾸면 안 되는 것 (기능 — 반드시 보존)

| 요소 | 이유 |
|---|---|
| `<form action={signInWithKakao}>` / `signInWithNaver` 구조 | **서버 액션**. onClick 핸들러/클라 컴포넌트로 바꾸면 인증이 깨진다. |
| 각 form 안의 `{safeNext && <input type="hidden" name="next" value={safeNext} />}` | 로그인 후 원래 페이지로 리다이렉트. 반드시 유지. |
| `<EmailAuthForm next={safeNext} />` 자리와 prop | 이메일 로그인/가입 진입점. |
| `safeNext` 파싱 로직 (open-redirect 방지) | 보안. 그대로 둘 것. |
| 카카오 `#FEE500`, 네이버 `#03C75A` 버튼색 | 브랜드 규정색. 토큰화하지 말고 고정. |
| `page.tsx`는 `async` 서버 컴포넌트 유지 | `'use client'` 붙이지 말 것. |
| 약관/개인정보 링크, "홈으로" 링크 | 법적·UX 필수. |

---

## 4. 개선해도 되는 것 (자유)
- 카드 여백/간격/그림자 위계, 제목·서브카피 타이포 스케일
- 소셜 버튼 아이콘·정렬·hover 인터랙션
- "또는" 구분선, 로그인/회원가입 탭 스위치의 시각적 완성도
- 배경(그라디언트/패턴은 토큰 색 범위 안에서), 반응형 여백
- 좌우 2단(브랜드 비주얼 + 폼) 같은 레이아웃 제안은 **선택적으로** 가능하나, 모바일에서 폼 우선

---

## 5. 넘기지 않아도 되는 것
- 전체 코드베이스 / node_modules
- `actions/auth` 내부 구현 (시그니처만 위에 있음)
- 환경변수·시크릿·Supabase 키
