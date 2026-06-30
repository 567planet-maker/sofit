import type { Metadata } from 'next'
import { Geist, Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['900'],
})

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
    <html lang="ko" className={`${geist.variable} ${notoSansKR.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  )
}
