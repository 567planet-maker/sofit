import { cn } from '@/lib/utils/cn'
import Avatar from '@/components/ui/Avatar'

/** 아바타 + 이름 칩 (헤더·사이드바 하단·채팅 공통) */
export default function UserChip({
  name,
  avatarUrl,
  subtitle,
  size = 'md',
  hideText = false,
  className,
}: {
  name: string | null
  avatarUrl: string | null
  subtitle?: string | null
  size?: 'sm' | 'md' | 'lg'
  hideText?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar src={avatarUrl} name={name} size={size} />
      {!hideText && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{name ?? '사용자'}</p>
          {subtitle && <p className="truncate text-xs text-ink-subtle">{subtitle}</p>}
        </div>
      )}
    </div>
  )
}
