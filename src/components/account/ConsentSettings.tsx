'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateMarketingConsent } from '@/app/actions/profile'

function ConsentRow({
  title,
  desc,
  right,
}: {
  title: string
  desc: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-subtle">{desc}</p>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  )
}

export default function ConsentSettings({ initialMarketing }: { initialMarketing: boolean }) {
  const [marketing, setMarketing] = useState(initialMarketing)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleMarketing() {
    const next = !marketing
    setMarketing(next)
    setError(null)
    startTransition(async () => {
      const res = await updateMarketingConsent(next)
      if (res.error) {
        setMarketing(!next) // 롤백
        setError(res.error)
      }
    })
  }

  return (
    <div>
      <ConsentRow
        title="서비스 이용약관 (필수)"
        desc="가입 시 동의 완료"
        right={
          <Link href="/terms" className="text-xs font-medium text-brand hover:underline">
            보기
          </Link>
        }
      />
      <ConsentRow
        title="개인정보 처리방침 (필수)"
        desc="가입 시 동의 완료"
        right={
          <Link href="/privacy" className="text-xs font-medium text-brand hover:underline">
            보기
          </Link>
        }
      />
      <ConsentRow
        title="마케팅 정보 수신 (선택)"
        desc="이벤트·혜택 소식을 받아봅니다"
        right={
          <button
            type="button"
            onClick={toggleMarketing}
            disabled={isPending}
            role="switch"
            aria-checked={marketing}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              marketing ? 'bg-brand' : 'bg-border-strong'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                marketing ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        }
      />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}
