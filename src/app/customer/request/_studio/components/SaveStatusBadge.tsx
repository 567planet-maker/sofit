'use client'

// ============================================================
// 저장 상태 배지 (Phase 4) — pill + 상태 dot
// ============================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SaveStatusBadge({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { label: string; badge: string; dot: string }> = {
    idle: { label: '임시저장됨', badge: 'bg-surface-muted text-ink-subtle', dot: 'bg-ink-subtle' },
    saving: { label: '저장 중…', badge: 'bg-brand-tint text-brand', dot: 'bg-brand animate-pulse' },
    saved: { label: '저장됨', badge: 'bg-success-tint text-success', dot: 'bg-success' },
    error: {
      label: '저장 실패',
      badge: 'bg-danger-tint text-danger',
      dot: 'bg-danger',
    },
  }
  const { label, badge, dot } = map[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1.5 text-xs font-bold ${badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
