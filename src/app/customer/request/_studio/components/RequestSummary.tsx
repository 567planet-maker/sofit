'use client'

// ============================================================
// 우측 실시간 요약 + 저장 상태 + 제출 (Phase 4)
// (분야별 첨부 업로더는 Phase 8에서 추가)
// ============================================================

import { CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'
import SaveStatusBadge, { type SaveStatus } from './SaveStatusBadge'

export default function RequestSummary({
  selected,
  missingCount,
  saveStatus,
  submitting,
  onSave,
  onSubmit,
  submitError,
}: {
  selected: CategoryKey[]
  missingCount: number
  saveStatus: SaveStatus
  submitting: boolean
  onSave: () => void
  onSubmit: () => void
  submitError: string | null
}) {
  return (
    <div className="space-y-4 rounded-card bg-white p-5 shadow-card ring-1 ring-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">요청 요약</h3>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-subtle">선택 분야</dt>
          <dd className="font-medium text-ink">{selected.length}개</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-subtle">미입력 필수</dt>
          <dd className={`font-medium ${missingCount > 0 ? 'text-danger' : 'text-success'}`}>
            {missingCount}개
          </dd>
        </div>
      </dl>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <li
              key={c}
              className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand"
            >
              {CATEGORY_LABELS[c]}
            </li>
          ))}
        </ul>
      )}

      {submitError && (
        <p className="rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">{submitError}</p>
      )}

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="w-full rounded-control bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? '제출 중…' : '견적 요청 제출'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="w-full rounded-control border border-border px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          임시저장
        </button>
      </div>

      <p className="text-center text-xs text-ink-subtle">
        작성 내용은 자동으로 임시저장됩니다.
      </p>
    </div>
  )
}
