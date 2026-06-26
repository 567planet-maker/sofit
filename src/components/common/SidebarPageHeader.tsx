'use client'

import { usePathname } from 'next/navigation'
import type { SidebarNavItem } from './SidebarNav'

/** 활성 사이드바 메뉴 기준으로 페이지 제목을 자동 표시 (모든 사이드바 레이아웃 공통) */
export default function SidebarPageHeader({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname()
  const active = items.find((i) =>
    i.exact ? pathname === i.href : pathname.startsWith(i.href),
  )
  if (!active) return null

  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{active.label}</h1>
      {active.description && <p className="mt-1 text-sm text-ink-muted">{active.description}</p>}
    </div>
  )
}
