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
