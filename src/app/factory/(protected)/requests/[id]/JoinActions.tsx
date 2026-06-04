'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinRequest } from '@/app/actions/factory'

export default function JoinActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleJoin = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await joinRequest(requestId)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        이 요청서에 참여하면 고객과 채팅방이 개설되고 견적서를 작성할 수 있습니다.
      </p>
      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        onClick={handleJoin}
        disabled={isPending}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? '처리 중...' : '매칭 참여하기'}
      </button>
    </div>
  )
}
