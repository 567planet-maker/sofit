// ============================================================
// 스튜디오 공용 헬퍼 (Phase 4)
// ============================================================

import type { FieldDef } from '@/app/customer/request/schema/types'
import { isUnknownValue } from '@/app/customer/request/schema/types'

/** 값이 채워졌는지 ("모름" 선택도 채움으로 인정 — 서버 검증과 동일 규칙) */
export function isFilledValue(v: unknown): boolean {
  if (isUnknownValue(v)) return true
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

/** 필수 필드 충족 통계 */
export function requiredStats(
  fields: FieldDef[],
  values: Record<string, unknown>,
): { filled: number; total: number } {
  const required = fields.filter((f) => f.required)
  const filled = required.filter((f) => isFilledValue(values[f.key])).length
  return { filled, total: required.length }
}

/** 진행률 % (필수 기준). 필수가 없으면 채워진 필드 유무로 0/100 */
export function progressPercent(
  fields: FieldDef[],
  values: Record<string, unknown>,
): number {
  const { filled, total } = requiredStats(fields, values)
  if (total === 0) {
    const anyFilled = fields.some((f) => isFilledValue(values[f.key]))
    return anyFilled ? 100 : 0
  }
  return Math.round((filled / total) * 100)
}
