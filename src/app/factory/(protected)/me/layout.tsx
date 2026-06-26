import SidebarLayout, { type SidebarNavItem } from '@/components/common/SidebarLayout'

const ITEMS: SidebarNavItem[] = [
  { href: '/factory/me', label: '계정 및 프로필', exact: true, description: '공장 정보와 계정을 관리합니다.' },
  { href: '/factory/me/support', label: '고객 지원', description: '자주 묻는 질문과 문의 안내.' },
  { href: '/factory/me/account', label: '계정 관리', description: '동의 설정과 로그아웃·탈퇴.' },
]

export default function FactoryMyPageLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout items={ITEMS}>{children}</SidebarLayout>

}
