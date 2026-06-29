'use client'

// ============================================================
// 저장 상태 배지 (Phase 4)
// ============================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SaveStatusBadge({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { label: string; cls: string }> = {
    idle: { label: '자동 임시저장됨', cls: 'text-ink-subtle' },
    saving: { label: '저장 중…', cls: 'text-brand' },
    saved: { label: '✓ 저장됨', cls: 'text-success' },
    error: { label: '저장 실패 (재시도 필요)', cls: 'text-danger' },
  }
  const { label, cls } = map[status]
  return <span className={`text-xs ${cls}`}>{label}</span>
}
