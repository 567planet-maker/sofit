import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export type TabItem = { label: string; value: string; count?: number }

/**
 * URL 쿼리 기반 pill 탭 (서버 컴포넌트에서 사용).
 * basePath + ?{paramName}={value} 로 링크 생성.
 */
export default function Tabs({
  items,
  active,
  basePath,
  paramName = 'status',
  className,
}: {
  items: TabItem[]
  active: string
  basePath: string
  paramName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto rounded-control bg-surface-muted p-1',
        className,
      )}
    >
      {items.map((t) => {
        const isActive = active === t.value
        const href = t.value === 'all' ? basePath : `${basePath}?${paramName}=${t.value}`
        return (
          <Link
            key={t.value}
            href={href}
            className={cn(
              'flex-shrink-0 rounded-[0.6rem] px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-surface text-brand shadow-sm'
                : 'text-ink-subtle hover:text-ink-muted',
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={cn('ml-1.5 text-xs', isActive ? 'text-brand' : 'text-ink-subtle')}>
                {t.count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
