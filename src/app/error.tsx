'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-5xl font-semibold text-border-strong">500</p>
      <h1 className="mt-4 text-xl font-semibold text-ink">일시적인 오류가 발생했어요</h1>
      <p className="mt-2 text-sm text-ink-muted">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 운영팀에 문의해 주세요.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-control bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="rounded-control border border-border bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          홈으로
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-ink-subtle">오류 코드: {error.digest}</p>
      )}
    </div>
  )
}
