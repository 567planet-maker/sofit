import type { SidebarNavItem } from '@/components/common/SidebarNav'

/** 공장 관리 사이드바 메뉴 (manage 레이아웃 + 채팅 레이아웃 공유) */
export const FACTORY_MANAGE_NAV: SidebarNavItem[] = [
  { href: '/factory', label: '홈', exact: true, description: '소핏 파트너 대시보드' },
  {
    href: '/factory/requests',
    label: '매칭 요청',
    description: '신규 요청을 확인하고 매칭에 참여하세요.',
  },
  {
    href: '/factory/categories',
    label: '전문 분야',
    description: '시공 가능한 분야를 선택하면 해당 분야 견적 요청에 매칭됩니다.',
  },
  {
    href: '/factory/portfolios',
    label: '포트폴리오',
    description: '작업 사례를 등록하면 고객에게 공개됩니다.',
  },
  {
    href: '/factory/projects',
    label: '진행 프로젝트',
    description: '계약이 확정된 프로젝트의 시공 현황을 관리하세요.',
  },
  { href: '/factory/chat', label: '채팅' },
]
