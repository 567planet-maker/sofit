import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui'

export const metadata: Metadata = {
  title: '견적 요청 완료',
}

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-card bg-brand-tint">
            <svg
              className="h-8 w-8 text-brand"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-ink">견적 요청이 접수됐습니다!</h1>
          <p className="mt-3 leading-relaxed text-ink-muted">
            소핏 담당자가 영업일 기준 1~2일 내로 검토 후 연락드립니다.
            <br />
            궁금한 사항은 채팅으로 문의해주세요.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {id && (
              <Link href="/customer/requests" className={buttonVariants({ size: 'lg' })}>
                내 견적 현황 보기
              </Link>
            )}
            <Link href="/" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              홈으로 돌아가기
            </Link>
          </div>
        </div>
    </div>
  )
}
