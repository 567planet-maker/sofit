'use client'

import { useActionState, useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth'

function LoginForm() {
  const [state, action, pending] = useActionState(signInWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="이메일"
        required
        autoComplete="email"
        className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        required
        autoComplete="current-password"
        className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
      />
      {state?.error && (
        <p className="text-center text-xs text-red-500">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '로그인 중...' : '이메일로 로그인'}
      </button>
    </form>
  )
}

function SignupForm() {
  const [state, action, pending] = useActionState(signUpWithEmail, null)
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="이메일"
        required
        autoComplete="email"
        className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호 (8자 이상)"
        required
        minLength={8}
        autoComplete="new-password"
        className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
      />
      {state?.error && (
        <p className="text-center text-xs text-red-500">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-center text-xs text-blue-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '가입 중...' : '이메일로 회원가입'}
      </button>
    </form>
  )
}

export function EmailAuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">또는</span>
        </div>
      </div>

      <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          회원가입
        </button>
      </div>

      {mode === 'login' ? <LoginForm /> : <SignupForm />}
    </div>
  )
}
