import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'

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
    <>
      <Header />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">견적 요청이 접수됐습니다!</h1>
          <p className="mt-3 leading-relaxed text-gray-500">
            소핏 담당자가 영업일 기준 1~2일 내로 검토 후 연락드립니다.
            <br />
            궁금한 사항은 채팅으로 문의해주세요.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {id && (
              <Link
                href="/customer/requests"
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                내 견적 현황 보기
              </Link>
            )}
            <Link
              href="/"
              className="rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
