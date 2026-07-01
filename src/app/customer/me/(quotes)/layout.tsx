import SidebarLayout, { type SidebarNavItem } from '@/components/common/SidebarLayout'

// 견적 관리 섹션 — 헤더의 '내 견적관리' 진입점. 마이페이지와 별개의 사이드바.
const ITEMS: SidebarNavItem[] = [
  { href: '/customer/me/requests', label: '내 견적 관리', description: '접수한 견적의 진행 상황을 확인하세요.' },
  { href: '/customer/me/wishlist', label: '찜 / 관심 업체', description: '관심 있는 공장을 모아 보세요.' },
]

export default function CustomerQuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout title="견적 관리" items={ITEMS}>
      {children}
    </SidebarLayout>
  )
}
