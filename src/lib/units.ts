// ============================================================
// 단위 변환 유틸 (Phase 0)
// 정책: 면적은 내부적으로 ㎡로 저장, UI에서 평↔㎡ 토글.
//       치수는 mm로 통일. (견적_양식_현황.md의 mm/cm 불일치 정리)
// ============================================================

/** 1평 = 3.305785㎡ (한국 부동산 표준) */
export const PYEONG_TO_M2 = 3.305785

/** 평 → ㎡ */
export function pyeongToM2(pyeong: number): number {
  return pyeong * PYEONG_TO_M2
}

/** ㎡ → 평 */
export function m2ToPyeong(m2: number): number {
  return m2 / PYEONG_TO_M2
}

/** 평 → ㎡ (소수 1자리 반올림). null/NaN은 null 반환 */
export function pyeongToM2Rounded(pyeong: number | null | undefined): number | null {
  if (pyeong == null || Number.isNaN(pyeong)) return null
  return Math.round(pyeongToM2(pyeong) * 10) / 10
}

/** ㎡ → 평 (소수 1자리 반올림). null/NaN은 null 반환 */
export function m2ToPyeongRounded(m2: number | null | undefined): number | null {
  if (m2 == null || Number.isNaN(m2)) return null
  return Math.round(m2ToPyeong(m2) * 10) / 10
}

export type AreaUnit = 'pyeong' | 'm2'

/** 면적 표시 문자열 (예: "33.1㎡ (10평)") */
export function formatArea(m2: number | null | undefined): string {
  if (m2 == null || Number.isNaN(m2)) return '-'
  const py = m2ToPyeongRounded(m2)
  return `${m2}㎡${py != null ? ` (${py}평)` : ''}`
}

// ─── 치수(mm) ───────────────────────────────────────────────

/** mm → m (소수 2자리) */
export function mmToM(mm: number | null | undefined): number | null {
  if (mm == null || Number.isNaN(mm)) return null
  return Math.round((mm / 1000) * 100) / 100
}

/** 치수 표시 문자열 (예: "4000 × 800mm") */
export function formatDimension(
  width_mm?: number | null,
  height_mm?: number | null,
  depth_mm?: number | null,
): string {
  const parts = [width_mm, height_mm, depth_mm].filter(
    (v): v is number => v != null && !Number.isNaN(v),
  )
  if (parts.length === 0) return '-'
  return `${parts.join(' × ')}mm`
}
