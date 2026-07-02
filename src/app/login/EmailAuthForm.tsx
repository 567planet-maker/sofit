'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth'

const fieldClass =
  'h-[42px] rounded-card border border-border px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-tint)]'

function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-2.5">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="flex flex-col gap-2">
        <input
          name="email"
          type="email"
          placeholder="이메일"
          required
          autoComplete="email"
          className={fieldClass}
        />
        <input
          name="password"
          type="password"
          placeholder="비밀번호"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>
      {state?.error && <p className="text-center text-xs text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-control bg-brand text-[14.5px] font-bold text-white transition-[background,transform] duration-100 hover:bg-brand-hover active:translate-y-px disabled:opacity-50"
      >
        {pending ? '로그인 중...' : '이메일로 로그인'}
      </button>
    </form>
  )
}

function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUpWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-2.5">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="flex flex-col gap-2">
        <input
          name="name"
          type="text"
          placeholder="이름"
          required
          autoComplete="name"
          className={fieldClass}
        />
        <input
          name="email"
          type="email"
          placeholder="이메일"
          required
          autoComplete="email"
          className={fieldClass}
        />
        <input
          name="password"
          type="password"
          placeholder="비밀번호 (8자 이상)"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>
      <label className="flex cursor-pointer items-start gap-2 px-0.5 pt-px">
        <input
          name="agreed"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand"
        />
        <span className="text-[12.5px] leading-[1.55] text-ink-muted">
          <a
            href="/terms"
            target="_blank"
            className="font-bold text-ink underline underline-offset-2"
          >
            이용약관
          </a>{' '}
          및{' '}
          <a
            href="/privacy"
            target="_blank"
            className="font-bold text-ink underline underline-offset-2"
          >
            개인정보처리방침
          </a>
          에 동의합니다. <span className="font-bold text-danger">(필수)</span>
        </span>
      </label>
      {state?.error && <p className="text-center text-xs text-danger">{state.error}</p>}
      {state?.message && <p className="text-center text-xs text-success">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-card bg-ink text-[14.5px] font-bold text-white transition-[opacity,transform] duration-100 hover:opacity-90 active:translate-y-px disabled:opacity-50"
      >
        {pending ? '가입 중...' : '이메일로 회원가입'}
      </button>
    </form>
  )
}

export function EmailAuthForm({ next, social }: { next?: string; social: ReactNode }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div>
      {/* 헤딩 — 탭 모드에 따라 문구 스왑 */}
      <div className="mb-4">
        <h1 className="text-[21px] font-extrabold tracking-[-.03em] text-ink">
          {mode === 'login' ? '다시 만나서 반가워요' : '계정 만들기'}
        </h1>
        <p className="mt-[5px] text-[13.5px] font-medium text-ink-muted">
          {mode === 'login' ? '계정으로 로그인하고 견적을 이어가세요' : '몇 초면 가입이 끝나요'}
        </p>
      </div>

      {/* 소셜 로그인 (서버 액션 form — page.tsx에서 주입) */}
      {social}

      {/* 구분선 */}
      <div className="relative my-3.5 text-center">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <span className="relative bg-surface px-3 text-[12.5px] font-semibold text-ink-subtle">
          또는
        </span>
      </div>

      {/* 로그인/회원가입 pill 탭 — 흰 pill이 슬라이드 */}
      <div className="relative mb-3 flex rounded-card bg-surface-muted p-1">
        <span
          className="pointer-events-none absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-[7px] bg-white shadow-card transition-transform duration-200 ease-out"
          style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
        />
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`relative z-10 flex-1 rounded-[7px] py-[7px] text-center text-[13.5px] font-bold transition-colors ${
            mode === 'login' ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`relative z-10 flex-1 rounded-[7px] py-[7px] text-center text-[13.5px] font-bold transition-colors ${
            mode === 'signup' ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          회원가입
        </button>
      </div>

      {mode === 'login' ? <LoginForm next={next} /> : <SignupForm next={next} />}
    </div>
  )
}
