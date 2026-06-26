import { cn } from '@/lib/utils/cn'

type DivProps = React.HTMLAttributes<HTMLDivElement>

/** 기본 패널. interactive=true 면 hover 시 그림자 상승 (목록 카드용) */
export function Card({
  className,
  interactive = false,
  ...props
}: DivProps & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        interactive && 'transition-shadow hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div className={cn('flex items-center justify-between border-b border-border px-5 py-4', className)} {...props} />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-base font-semibold text-ink', className)} {...props} />
}
