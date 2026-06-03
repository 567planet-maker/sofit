'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  pendingRequests: number
  pendingFactories: number
}

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '📊', exact: true },
  { href: '/admin/requests', label: '견적 요청', icon: '📋' },
  { href: '/admin/factories', label: '공장 관리', icon: '🏭' },
  { href: '/admin/chats', label: '채팅', icon: '💬' },
  { href: '/admin/users', label: '사용자', icon: '👤' },
]

export default function AdminNav({ pendingRequests, pendingFactories }: Props) {
  const pathname = usePathname()

  function getBadge(href: string) {
    if (href === '/admin/requests') return pendingRequests
    if (href === '/admin/factories') return pendingFactories
    return 0
  }

  return (
    <nav className="px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const badge = getBadge(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </span>
            {badge > 0 && (
              <span className="min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
