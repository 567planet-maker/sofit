import SidebarLayout, { type SidebarNavItem } from '@/components/common/SidebarLayout'

const ITEMS: SidebarNavItem[] = [
  { href: '/customer/me', label: '계정 및 프로필', exact: true, description: '내 정보와 계정을 관리합니다.' },
  { href: '/customer/me/requests', label: '내 견적 관리', description: '접수한 견적의 진행 상황을 확인하세요.' },
  { href: '/customer/me/wishlist', label: '찜 / 관심 업체', description: '관심 있는 공장을 모아 보세요.' },
  { href: '/customer/me/support', label: '고객 지원', description: '자주 묻는 질문과 문의 안내.' },
  { href: '/customer/me/account', label: '계정 관리', description: '동의 설정과 로그아웃·탈퇴.' },
]

export default function CustomerMyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout title="마이페이지" items={ITEMS}>
      {children}
    </SidebarLayout>
  )

}
