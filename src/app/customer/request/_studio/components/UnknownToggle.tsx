'use client'

// ============================================================
// "모름 / 상담 / 현장확인 / 실측" 안전장치 토글 (Phase 4)
// 활성화하면 해당 필드 값이 UnknownValue 로 대체되고 입력 위젯은 숨겨진다.
// ============================================================

import type { UnknownMode } from '@/app/customer/request/schema/types'

const MODE_LABEL: Record<UnknownMode, string> = {
  unknown: '잘 모름',
  consult: '추천 요청 (잘 모름)',
  site_check: '현장 확인 필요',
  measure: '실측 요청',
}

export default function UnknownToggle({
  mode,
  active,
  onToggle,
}: {
  mode: UnknownMode
  active: boolean
  onToggle: (on: boolean) => void
}) {
  return (
    <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-subtle">
      <input
        type="checkbox"
        checked={active}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-border-strong text-brand focus:ring-brand"
      />
      {MODE_LABEL[mode]}
    </label>
  )
}
