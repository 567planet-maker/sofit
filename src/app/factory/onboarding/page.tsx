'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createFactoryProfile } from '@/app/actions/factory'

const schema = z.object({
  company_name: z.string().min(1, '회사명을 입력해주세요'),
  location: z.string().optional(),
  description: z.string().optional(),
})

type FactoryFormValues = z.infer<typeof schema>

export default function FactoryOnboardingPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FactoryFormValues>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-ink">공장 정보 입력</h1>
          <p className="mt-2 text-sm text-ink-muted">
            관리자 심사 후 소핏 파트너로 승인됩니다
          </p>
        </div>

        <form
          onSubmit={handleSubmit((values) => createFactoryProfile(values))}
          className="rounded-card bg-white p-8 shadow-card"
        >
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('company_name')}
                placeholder="예) 천일쇼파"
                className="w-full rounded-card border border-border px-4 py-3 text-sm outline-none focus:border-black"
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                소재지
              </label>
              <input
                {...register('location')}
                placeholder="예) 부산광역시 사상구"
                className="w-full rounded-card border border-border px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                업체 소개
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="주요 취급 품목, 경력 등을 간략히 소개해주세요"
                className="w-full resize-none rounded-card border border-border px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-card bg-black py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isSubmitting ? '제출 중...' : '심사 신청하기'}
          </button>

          <p className="mt-4 text-center text-xs text-ink-subtle">
            사업자등록증 제출은 승인 후 진행됩니다
          </p>
        </form>
      </div>
    </div>
  )
}
