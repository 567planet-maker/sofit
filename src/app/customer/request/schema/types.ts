// ============================================================
// 견적 스키마 — 핵심 타입 정의 (Phase 0)
// 설계안 K-1 기준. 폼(DynamicField)·상세(CategoryItemView)·검증이
// 모두 이 타입을 단일 소스로 공유한다.
// ============================================================

import type { CategoryKey } from './categories'

// ─── 입력 위젯 타입 ──────────────────────────────────────────
export type FieldType =
  | 'text'
  | 'textarea'
  | 'tel'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'dimension' // width/height(/depth) mm 묶음
  | 'address' // 우편번호+도로명+상세 (jsonb 저장)
  | 'area' // 면적: 평↔㎡ 토글, 내부 ㎡ 저장

// ─── "모름/상담/현장확인/실측" 안전장치 ──────────────────────
// 고객이 전문 용어를 몰라도 넘어갈 수 있게 하는 옵션.
// 선택 시 details 값 자체가 UnknownValue 가 된다 → "고객이 모른다"는
// 사실까지 데이터로 보존(업체·관리자가 인지 가능).
export type UnknownMode = 'unknown' | 'consult' | 'site_check' | 'measure'

export interface UnknownValue {
  __unknown: true
  reason: UnknownMode
}

export function isUnknownValue(v: unknown): v is UnknownValue {
  return typeof v === 'object' && v !== null && (v as UnknownValue).__unknown === true
}

// ─── 필드 정의 ───────────────────────────────────────────────
export interface FieldOption {
  value: string
  label: string
}

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: FieldOption[]
  /** number/dimension 단위 표기 (예: 'mm', '개') */
  unit?: string
  placeholder?: string
  /** 입력 도움말 (예: "잘 모르시면 추천 요청을 선택하세요.") */
  help?: string
  /** 부착할 "모름" 안전장치 종류. 없으면 안전장치 미제공. */
  unknown?: UnknownMode
}

// ─── 분야(카테고리) 스키마 ───────────────────────────────────
export interface CategorySchema {
  category: CategoryKey
  /** 대분류 그룹명 (예: '골조·목공') — 사이드바 묶음용 */
  group: string
  /** 분야 표시명 (예: '목공') */
  label: string
  /** 스키마 버전 — 필드가 바뀌어도 과거 데이터 해석 가능 */
  version: number
  fields: FieldDef[]
}

// ─── 공통 정보 스키마 (분야 무관, 항상 입력) ─────────────────
export interface CommonSection {
  id: string
  label: string
  /** 필수 섹션 여부 (UI 안내용) */
  required?: boolean
  fields: FieldDef[]
}

// ─── 차원(dimension) 값 형태 ────────────────────────────────
export interface DimensionValue {
  width_mm?: number | null
  height_mm?: number | null
  depth_mm?: number | null
}

// ─── 주소(address) 값 형태 — quote_requests.address jsonb ────
export interface AddressValue {
  zipcode?: string | null
  road?: string | null
  detail?: string | null
  lat?: number | null
  lng?: number | null
}
