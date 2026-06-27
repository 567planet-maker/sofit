import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-5xl font-semibold text-border-strong">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm text-ink-muted">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-control bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
