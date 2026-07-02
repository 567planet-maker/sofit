'use client'

// ============================================================
// "모름 / 상담 / 현장확인 / 실측" 안전장치 토글 (Phase 4)
// 활성화하면 해당 필드 값이 UnknownValue 로 대체되고 입력 위젯은 비활성/흐림 처리된다.
// 필드 라벨 우측에 pill 형태로 붙는다.
// ============================================================

import type { UnknownMode } from '@/app/customer/request/schema/types'

const MODE_LABEL: Record<UnknownMode, string> = {
  unknown: '잘 모름',
  consult: '추천 요청',
  site_check: '현장 확인',
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
    <button
      type="button"
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-pill border border-transparent px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-ink text-white' : 'bg-surface-muted text-ink-muted hover:text-ink'
      }`}
    >
      {MODE_LABEL[mode]}
    </button>
  )
}
