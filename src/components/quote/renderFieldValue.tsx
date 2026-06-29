// ============================================================
// FieldDef + 값 → 표시 노드 변환 (읽기 렌더 공용, Phase 5)
// CategoryItemView(분야 상세) / RequestCommonView(공통 정보) 공유.
// ============================================================

import { isUnknownValue, type FieldDef, type UnknownMode } from '@/app/customer/request/schema/types'
import { formatArea, formatDimension } from '@/lib/units'

const UNKNOWN_LABEL: Record<UnknownMode, string> = {
  unknown: '잘 모름',
  consult: '추천 요청',
  site_check: '현장 확인 필요',
  measure: '실측 요청',
}

export function renderFieldValue(def: FieldDef, value: unknown): React.ReactNode {
  if (isUnknownValue(value)) {
    return (
      <span className="rounded-full bg-warning-tint px-2 py-0.5 text-xs font-medium text-warning">
        {UNKNOWN_LABEL[value.reason] ?? '미정'}
      </span>
    )
  }
  if (value === null || value === undefined || value === '') return null

  switch (def.type) {
    case 'select': {
      const opt = def.options?.find((o) => o.value === value)
      return opt?.label ?? String(value)
    }
    case 'multiselect': {
      const arr = Array.isArray(value) ? value : []
      if (arr.length === 0) return null
      return arr.map((v) => def.options?.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    case 'boolean':
      return value ? '예' : '아니오'
    case 'number':
      return `${value}${def.unit && def.unit !== 'm2' ? ` ${def.unit}` : ''}`
    case 'area':
      return formatArea(value as number)
    case 'dimension': {
      const d = value as { width_mm?: number | null; height_mm?: number | null; depth_mm?: number | null }
      return formatDimension(d.width_mm, d.height_mm, d.depth_mm)
    }
    case 'address': {
      const a = value as { road?: string | null; detail?: string | null }
      return [a.road, a.detail].filter(Boolean).join(' ') || null
    }
    default:
      return String(value)
  }
}
