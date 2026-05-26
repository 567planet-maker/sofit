'use client'

import { useState } from 'react'
import { updateUserRole } from '@/app/actions/auth'

export default function OnboardingPage() {
  const [agreed, setAgreed] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleRoleSelect(role: 'customer' | 'factory') {
    if (!agreed || pending) return
    setPending(true)
    await updateUserRole(role)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">소핏에 오신 걸 환영해요</h1>
          <p className="mt-2 text-sm text-gray-500">사용 방법을 선택해주세요</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* 약관 동의 */}
          <label className="mb-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black"
            />
            <span className="text-sm text-gray-600">
              <a href="/terms" target="_blank" className="font-medium underline">이용약관</a>
              {' '}및{' '}
              <a href="/privacy" target="_blank" className="font-medium underline">개인정보처리방침</a>
              에 동의합니다. (필수)
            </span>
          </label>

          {/* 역할 선택 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleRoleSelect('customer')}
              disabled={!agreed || pending}
              className="rounded-xl border-2 border-black bg-black p-5 text-left text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="text-base font-semibold">고객으로 시작하기</div>
              <div className="mt-1 text-sm text-gray-300">
                소파·빌트인 견적을 요청하고 공장 견적서를 받아보세요
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('factory')}
              disabled={!agreed || pending}
              className="rounded-xl border-2 border-gray-200 p-5 text-left transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="text-base font-semibold text-gray-900">공장으로 입점하기</div>
              <div className="mt-1 text-sm text-gray-500">
                소핏 파트너 공장으로 등록하고 매칭 견적 요청을 받아보세요
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
