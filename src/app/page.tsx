import type { Metadata } from 'next'
import SofitLanding from '@/components/landing/SofitLanding'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: '소핏 — 인테리어의 모든 공정, 쉽고 투명하게',
  description:
    '검증된 공장과 직접 연결. 견적 요청부터 비교, 공정 관리까지 소핏이 한 곳에서 관리합니다. 지금 바로 무료 견적을 요청하세요.',
  openGraph: {
    title: '소핏 — 인테리어의 모든 공정, 쉽고 투명하게',
    description: '검증된 공장과 직접 연결. 견적부터 시공까지 소핏이 관리합니다.',
  },
}

export default function HomePage() {
  return <SofitLanding header={<LandingHeader />} />
}
