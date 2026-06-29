// ============================================================
// 공통 견적 요청 필드 — 설계안 C 기준 (Phase 0)
// 어떤 분야를 고르든 항상 받는 정보. quote_requests 부모 행에 저장.
// 단위 규칙: 면적은 내부 ㎡, 치수는 mm로 통일 (lib/units 참고).
// ============================================================

import type { CommonSection, FieldDef } from './types'

// ─── C-1. 현장 기본 정보 (필수) ──────────────────────────────
const SITE_BASIC: FieldDef[] = [
  { key: 'site_name', label: '현장명', type: 'text', required: true, placeholder: '예) 센텀 카페 리모델링' },
  { key: 'address', label: '현장 주소', type: 'address', required: true },
  { key: 'contact_name', label: '담당자명', type: 'text', required: true },
  { key: 'contact_phone', label: '연락처', type: 'tel', required: true, placeholder: '010-0000-0000' },
  {
    key: 'building_type',
    label: '건물 유형',
    type: 'select',
    required: true,
    options: [
      { value: 'apartment', label: '아파트' },
      { value: 'villa', label: '빌라/연립' },
      { value: 'house', label: '단독주택' },
      { value: 'retail', label: '상가' },
      { value: 'office', label: '사무실' },
      { value: 'lodging', label: '숙박' },
      { value: 'etc', label: '기타' },
    ],
  },
  {
    key: 'space_status',
    label: '공사 성격',
    type: 'select',
    required: true,
    options: [
      { value: 'new', label: '신축' },
      { value: 'full_remodel', label: '전체 리모델링' },
      { value: 'partial_remodel', label: '부분 리모델링' },
      { value: 'repair', label: '보수' },
    ],
  },
  {
    key: 'area_m2',
    label: '면적',
    type: 'area',
    unit: 'm2',
    help: '평/㎡ 토글로 입력. 모르면 비워두고 아래 "실측 필요"를 체크하세요.',
  },
]

// ─── C-2. 현장 조건 (선택) ───────────────────────────────────
const SITE_CONDITION: FieldDef[] = [
  { key: 'business_type', label: '업종', type: 'text', placeholder: '예) 카페, 병원, 오피스' },
  { key: 'floor', label: '해당 층', type: 'number', unit: '층' },
  { key: 'total_floors', label: '총 층수', type: 'number', unit: '층' },
  { key: 'has_elevator', label: '엘리베이터', type: 'boolean', help: '자재 반입 동선 판단' },
  { key: 'has_parking', label: '주차 가능', type: 'boolean' },
  {
    key: 'is_occupied',
    label: '거주/영업 중 여부',
    type: 'select',
    options: [
      { value: 'vacant', label: '공실' },
      { value: 'occupied_residence', label: '거주중' },
      { value: 'occupied_business', label: '영업중' },
    ],
    help: '야간·주말 공사 가능 여부 판단',
  },
  { key: 'available_time', label: '방문/공사 가능 시간', type: 'text', placeholder: '예) 평일 오전 9시~오후 6시' },
]

// ─── C-3. 일정·예산·요청 ─────────────────────────────────────
const SCHEDULE_BUDGET: FieldDef[] = [
  {
    key: 'desired_start_date',
    label: '공사 희망 시작일',
    type: 'date',
    help: '미정이면 비워두세요 (상담 후 결정 가능).',
  },
  { key: 'desired_end_date', label: '완료 희망일', type: 'date' },
  {
    key: 'needs_measurement',
    label: '실측 필요',
    type: 'boolean',
    help: '체크 시 분야별 치수는 "실측 요청"으로 처리됩니다.',
  },
  {
    key: 'budget_range',
    label: '예산 범위',
    type: 'select',
    required: true,
    options: [
      { value: 'under_10m', label: '1천만원 미만' },
      { value: '10m_30m', label: '1천~3천만원' },
      { value: '30m_50m', label: '3천~5천만원' },
      { value: '50m_100m', label: '5천만원~1억' },
      { value: 'over_100m', label: '1억원 이상' },
      { value: 'consult', label: '상담 필요' },
    ],
  },
  { key: 'special_requests', label: '추가 요청사항', type: 'textarea', placeholder: '자유롭게 입력하세요.' },
]

// ─── 공통 스키마 (섹션 구조) ─────────────────────────────────
export const COMMON_SCHEMA: CommonSection[] = [
  { id: 'site_basic', label: '현장 기본 정보', required: true, fields: SITE_BASIC },
  { id: 'site_condition', label: '현장 조건', fields: SITE_CONDITION },
  { id: 'schedule_budget', label: '일정·예산·요청', required: true, fields: SCHEDULE_BUDGET },
]

/** 검증·렌더용으로 평탄화한 전체 공통 필드 목록 */
export const COMMON_FIELDS: FieldDef[] = COMMON_SCHEMA.flatMap((s) => s.fields)

/**
 * 공통 스키마 키 → quote_requests 컬럼명 매핑.
 * 서버 액션(화이트리스트 저장)과 클라이언트(draft 하이드레이션)가 공유한다.
 * `address`는 기존 address(text)와 충돌을 피해 site_address(jsonb)로 저장.
 */
export const COMMON_COLUMN_MAP: Record<string, string> = {
  title: 'title',
  site_name: 'site_name',
  address: 'site_address',
  contact_name: 'contact_name',
  contact_phone: 'contact_phone',
  building_type: 'building_type',
  space_status: 'space_status',
  area_m2: 'area_m2',
  business_type: 'business_type',
  floor: 'floor',
  total_floors: 'total_floors',
  has_elevator: 'has_elevator',
  has_parking: 'has_parking',
  is_occupied: 'is_occupied',
  available_time: 'available_time',
  desired_start_date: 'desired_start_date',
  desired_end_date: 'desired_end_date',
  needs_measurement: 'needs_measurement',
  budget_range: 'budget_range',
  special_requests: 'special_requests',
}
