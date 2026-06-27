import Link from 'next/link'
import SidebarNav, { type SidebarNavItem } from './SidebarNav'
import SidebarPageHeader from './SidebarPageHeader'
import ChatHeaderBar from '@/components/chat/ChatHeaderBar'
import UserChip from '@/components/account/UserChip'
import { getCurrentProfile } from '@/lib/auth/current-user'

export type { SidebarNavItem }

function mypageHref(role: string | null | undefined) {
  if (role === 'admin') return '/admin/me'
  if (role === 'factory') return '/factory/me'
  return '/customer/me'
}

/** 좌측 풀높이 사이드바 패널 + 우측 콘텐츠 (어드민/채팅 스타일, 마이페이지·공장관리 공유) */
export default async function SidebarLayout({
  title,
  items,
  children,
}: {
  title: string
  items: SidebarNavItem[]
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  return (
    <div className="lg:flex">
      {/* 좌측 사이드바 — 채팅과 동일: 상단 헤더 바 + nav + 하단 프로필 */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col self-start border-r border-border bg-surface lg:flex">
        <ChatHeaderBar>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </ChatHeaderBar>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav items={items} />
        </div>
        {profile && (
          <Link
            href={mypageHref(profile.role)}
            className="border-t border-border p-3 transition-colors hover:bg-surface-muted"
          >
            <UserChip name={profile.name} avatarUrl={profile.avatarUrl} subtitle={profile.email} />
          </Link>
        )}
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
