export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          소핏
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          소파 견적 중개 플랫폼 — 준비 중
        </p>
        <a
          href="/login"
          className="mt-8 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          시작하기
        </a>
      </div>
    </div>
  )
}
