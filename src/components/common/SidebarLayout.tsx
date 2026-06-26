import SidebarNav, { type SidebarNavItem } from './SidebarNav'
import SidebarPageHeader from './SidebarPageHeader'

export type { SidebarNavItem }

/** 좌측 풀높이 사이드바 패널 + 우측 콘텐츠 (어드민 스타일, 마이페이지·공장관리 공유) */
export default function SidebarLayout({
  items,
  children,
}: {
  items: SidebarNavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* 좌측 사이드바 — 화면 끝에 붙는 플러시 패널 */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">
        {/* py-7 = 콘텐츠 p-7 과 동일 → 사이드바 첫 항목과 콘텐츠 상단 정렬 */}
        <div className="sticky top-16 px-3 py-7">
          <SidebarNav items={items} />
        </div>
      </aside>

      {/* 콘텐츠 */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl p-7">
          {/* 모바일 네비 (사이드바 패널이 숨겨질 때) */}
          <div className="mb-5 border-b border-border pb-3 lg:hidden">
            <SidebarNav items={items} orientation="horizontal" />
          </div>
          {/* 활성 메뉴 기준 페이지 제목 (공장관리·마이페이지 공통) */}
          <SidebarPageHeader items={items} />
          {children}
        </div>
      </div>
    </div>
  )
}
