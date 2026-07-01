import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://sofit.vercel.app'),
  title: {
    default: '소핏 (SOFIT)',
    template: '%s | 소핏',
  },
  description: '인테리어의 모든 공정, 이제 소핏으로 한 번에. 검증된 공장과 연결하는 발주 매칭 플랫폼.',
  keywords: ['인테리어', '시공', '발주', '견적', '공장', '매칭', '목공', '타일'],
  openGraph: {
    title: '소핏 (SOFIT)',
    description: '인테리어의 모든 공정, 이제 소핏으로 한 번에.',
    locale: 'ko_KR',
    type: 'website',
    url: 'https://sofit.vercel.app',
    siteName: '소핏',
  },
  twitter: {
    card: 'summary_large_image',
    title: '소핏 (SOFIT)',
    description: '인테리어의 모든 공정, 이제 소핏으로 한 번에. 검증된 공장 매칭 플랫폼.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 앱 전체 Pretendard (랜딩과 통일). Tailwind v4 @import 충돌 회피용으로 link 로 로드 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  )
}
