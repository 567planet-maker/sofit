import { cn } from '@/lib/utils/cn'
import { Card } from './Card'

/** 통계 카드 (대시보드) */
export default function Stat({
  label,
  value,
  unit,
  trend,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  unit?: React.ReactNode
  trend?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-medium text-ink-subtle">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-tight text-ink">
        {value}
        {unit && <span className="ml-0.5 text-[13px] font-medium text-ink-subtle">{unit}</span>}
      </p>
      {trend && <p className="mt-1.5 text-xs font-medium text-success">{trend}</p>}
    </Card>
  )
}
