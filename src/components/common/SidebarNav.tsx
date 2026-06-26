'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type SidebarNavItem = {
  href: string
  label: string
  exact?: boolean
  badge?: number
  description?: string
}

/** 공통 사이드바 네비게이션 (어드민·공장관리·마이페이지 공유) */
export default function SidebarNav({
  items,
  orientation = 'vertical',
}: {
  items: SidebarNavItem[]
  orientation?: 'vertical' | 'horizontal'
}) {
  const pathname = usePathname()
  const horizontal = orientation === 'horizontal'

  return (
    <nav
      className={
        horizontal
          ? 'flex gap-1 overflow-x-auto'
          : 'space-y-0.5'
      }
    >
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              horizontal ? 'shrink-0' : 'justify-between'
            } ${
              isActive
                ? 'bg-brand-tint text-brand'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="min-w-[20px] rounded-full bg-danger px-1.5 py-0.5 text-center text-xs font-semibold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
