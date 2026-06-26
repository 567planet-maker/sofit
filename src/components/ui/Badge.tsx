import { cn } from '@/lib/utils/cn'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-muted ring-border',
  brand: 'bg-brand-tint text-brand ring-brand/20',
  success: 'bg-success-tint text-success ring-success/20',
  warning: 'bg-warning-tint text-warning ring-warning/20',
  danger: 'bg-danger-tint text-danger ring-danger/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

export default function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
