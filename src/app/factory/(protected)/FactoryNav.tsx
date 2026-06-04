'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/factory', label: '홈' },
  { href: '/factory/requests', label: '매칭 요청' },
  { href: '/factory/portfolios', label: '포트폴리오' },
  { href: '/factory/projects', label: '진행 프로젝트' },
  { href: '/factory/chat', label: '채팅' },
]

export default function FactoryNav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/factory'
              ? pathname === '/factory'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 border-b-2 px-5 py-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
