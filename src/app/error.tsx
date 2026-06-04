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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-5xl font-bold text-gray-200">500</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-800">일시적인 오류가 발생했어요</h1>
      <p className="mt-2 text-sm text-gray-500">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 운영팀에 문의해 주세요.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
        >
          홈으로
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-gray-300">오류 코드: {error.digest}</p>
      )}
    </div>
  )
}
