import { cn } from '@/lib/utils/cn'

/** 데이터 없음 상태. 점선 박스 + 안내문 + (선택) 액션 */
export default function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center',
        className,
      )}
    >
      <p className="font-medium text-ink-muted">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-subtle">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
