// ============================================================
// 분야별 필드 스키마 레지스트리 — 설계안 D / K-1
//
// Phase 2: 빈도 높은 8개 분야 완성
//   carpentry·flooring·wallpaper·painting·lighting·kitchen·bathroom·sofa
// 이후 분야 추가 = 이 레지스트리에 CategorySchema 한 덩어리 추가로 끝.
//
// 폼(DynamicField)·상세(CategoryItemView)·제출검증이 모두
// getCategorySchema(category) 한 곳을 통해 스키마를 읽는다.
//
// 단위 규칙: 치수는 mm, 면적은 ㎡(공통 area_m2와 동일). 분야별 "실측 요청"은
//   공통 needs_measurement 로 일괄 처리하되, 대표 치수 필드에만 measure 안전장치를 둔다.
// ============================================================

import type { CategoryKey } from './categories'
import type { CategorySchema, FieldDef } from './types'

// 모든 분야 공통 말미 필드 (설계안 D: 분야별 note)
const NOTE_FIELD: FieldDef = { key: 'note', label: '추가 메모', type: 'textarea' }

export const FIELD_SCHEMAS: Partial<Record<CategoryKey, CategorySchema>> = {
  // ─── 목공 ───────────────────────────────────────────────
  carpentry: {
    category: 'carpentry',
    group: '골조·목공',
    label: '목공',
    version: 1,
    fields: [
      {
        key: 'work_items',
        label: '작업 항목',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'wall', label: '가벽' },
          { value: 'ceiling', label: '천장' },
          { value: 'molding', label: '문틀·몰딩' },
          { value: 'frame', label: '가구틀' },
          { value: 'partition', label: '파티션' },
          { value: 'platform', label: '단상' },
        ],
      },
      { key: 'space', label: '작업 공간', type: 'text', required: true, placeholder: '예) 거실, 주방' },
      {
        key: 'ceiling_type',
        label: '천장 형태',
        type: 'select',
        options: [
          { value: 'flat', label: '평천장' },
          { value: 'well', label: '우물천장' },
          { value: 'indirect', label: '간접' },
        ],
      },
      { key: 'area', label: '면적/길이', type: 'number', unit: 'm2' },
      { key: 'finish_included', label: '마감 포함', type: 'boolean' },
      {
        key: 'material_grade',
        label: '자재 등급',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'normal', label: '일반' },
          { value: 'e0', label: '친환경 E0' },
        ],
        help: '잘 모르시면 추천 요청을 선택하세요.',
      },
      NOTE_FIELD,
    ],
  },

  // ─── 바닥 ───────────────────────────────────────────────
  flooring: {
    category: 'flooring',
    group: '마감',
    label: '바닥',
    version: 1,
    fields: [
      {
        key: 'floor_material',
        label: '바닥재 종류',
        type: 'select',
        required: true,
        unknown: 'consult',
        options: [
          { value: 'gangmaru', label: '강마루' },
          { value: 'laminate', label: '강화마루' },
          { value: 'hardwood', label: '원목마루' },
          { value: 'sheet', label: '장판' },
          { value: 'tile', label: '타일' },
          { value: 'polishing', label: '폴리싱' },
          { value: 'epoxy', label: '에폭시' },
          { value: 'deco_tile', label: '데코타일' },
        ],
      },
      { key: 'area', label: '시공 면적', type: 'number', required: true, unit: 'm2' },
      { key: 'remove_existing', label: '기존 바닥 철거', type: 'boolean' },
      { key: 'pattern', label: '패턴/방향', type: 'text' },
      { key: 'baseboard_included', label: '걸레받이 포함', type: 'boolean' },
      { key: 'leveling_needed', label: '평탄 작업 필요', type: 'boolean' },
      {
        key: 'heating_type',
        label: '난방 종류',
        type: 'select',
        unknown: 'unknown',
        options: [
          { value: 'water', label: '온수' },
          { value: 'electric', label: '전기' },
          { value: 'none', label: '없음' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 도배 ───────────────────────────────────────────────
  wallpaper: {
    category: 'wallpaper',
    group: '마감',
    label: '도배',
    version: 1,
    fields: [
      {
        key: 'wallpaper_type',
        label: '벽지 종류',
        type: 'select',
        required: true,
        unknown: 'consult',
        options: [
          { value: 'silk', label: '실크' },
          { value: 'paper', label: '합지' },
          { value: 'flame_retardant', label: '방염' },
          { value: 'mural', label: '뮤럴' },
        ],
      },
      { key: 'area', label: '시공 면적', type: 'number', required: true, unit: 'm2', help: '벽면 기준 면적' },
      { key: 'remove_existing', label: '기존 벽지 제거', type: 'boolean' },
      { key: 'ceiling_included', label: '천장 포함', type: 'boolean' },
      { key: 'color_pattern', label: '컬러/패턴 희망', type: 'text' },
      {
        key: 'mold_area',
        label: '곰팡이·결로 부위',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 도장 ───────────────────────────────────────────────
  painting: {
    category: 'painting',
    group: '마감',
    label: '도장',
    version: 1,
    fields: [
      {
        key: 'paint_areas',
        label: '도장 부위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'wall', label: '벽' },
          { value: 'ceiling', label: '천장' },
          { value: 'door_molding', label: '문·몰딩' },
          { value: 'exterior', label: '외부' },
          { value: 'metal', label: '철물' },
        ],
      },
      { key: 'area', label: '면적', type: 'number', required: true, unit: 'm2' },
      {
        key: 'paint_type',
        label: '페인트 종류',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'water_based', label: '수성' },
          { value: 'oil_based', label: '유성' },
          { value: 'eco', label: '친환경' },
          { value: 'waterproof', label: '방수' },
          { value: 'special', label: '특수' },
        ],
      },
      { key: 'color', label: '색상', type: 'text', placeholder: '지정 색상 또는 추천 요청', unknown: 'consult' },
      {
        key: 'putty_needed',
        label: '퍼티·바탕 작업 필요',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'yes', label: '필요' },
          { value: 'no', label: '불필요' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 조명 ───────────────────────────────────────────────
  lighting: {
    category: 'lighting',
    group: '설비·전기',
    label: '조명',
    version: 1,
    fields: [
      {
        key: 'work_scope',
        label: '작업 범위',
        type: 'select',
        required: true,
        options: [
          { value: 'full_replace', label: '전체 교체' },
          { value: 'partial', label: '부분' },
          { value: 'new', label: '신규 설치' },
        ],
      },
      { key: 'space', label: '적용 공간', type: 'text', required: true, placeholder: '예) 거실, 침실' },
      {
        key: 'light_types',
        label: '조명 종류',
        type: 'multiselect',
        unknown: 'consult',
        options: [
          { value: 'recessed', label: '매입등' },
          { value: 'surface', label: '직부' },
          { value: 'rail', label: '레일' },
          { value: 'pendant', label: '펜던트' },
          { value: 'indirect', label: '간접' },
          { value: 'line', label: '라인' },
        ],
      },
      { key: 'count', label: '수량', type: 'number', unit: '개', unknown: 'consult' },
      {
        key: 'color_temp',
        label: '색온도',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'warm', label: '전구색' },
          { value: 'neutral', label: '주백색' },
          { value: 'cool', label: '주광색' },
        ],
      },
      { key: 'smart_dimming', label: '디밍·스마트', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 주방 ───────────────────────────────────────────────
  kitchen: {
    category: 'kitchen',
    group: '공간 가구',
    label: '주방',
    version: 1,
    fields: [
      {
        key: 'work_scope',
        label: '작업 범위',
        type: 'select',
        required: true,
        options: [
          { value: 'full_replace', label: '전체 교체' },
          { value: 'partial', label: '부분' },
          { value: 'sink_only', label: '싱크대만' },
        ],
      },
      {
        key: 'layout',
        label: '주방 형태',
        type: 'select',
        required: true,
        unknown: 'consult',
        options: [
          { value: 'straight', label: '일자형' },
          { value: 'l_shape', label: 'ㄱ자형' },
          { value: 'u_shape', label: 'ㄷ자형' },
          { value: 'island', label: '아일랜드' },
        ],
      },
      { key: 'cabinet_length', label: '상·하부장 길이', type: 'number', unit: 'mm', unknown: 'measure' },
      {
        key: 'countertop',
        label: '상판 재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'engineered', label: '인조대리석' },
          { value: 'ceramic', label: '세라믹' },
          { value: 'stainless', label: '스테인리스' },
        ],
      },
      { key: 'hood_cooktop', label: '후드·쿡탑 포함', type: 'boolean' },
      { key: 'storage_needs', label: '수납 요구', type: 'text' },
      NOTE_FIELD,
    ],
  },

  // ─── 욕실 ───────────────────────────────────────────────
  bathroom: {
    category: 'bathroom',
    group: '공간 가구',
    label: '욕실',
    version: 1,
    fields: [
      {
        key: 'work_scope',
        label: '작업 범위',
        type: 'select',
        required: true,
        options: [
          { value: 'full', label: '전체' },
          { value: 'partial', label: '부분' },
        ],
      },
      { key: 'bathroom_count', label: '욕실 개수', type: 'number', required: true, unit: '개' },
      {
        key: 'replace_items',
        label: '교체 항목',
        type: 'multiselect',
        options: [
          { value: 'toilet', label: '변기' },
          { value: 'basin', label: '세면대' },
          { value: 'bathtub', label: '욕조' },
          { value: 'shower_booth', label: '샤워부스' },
          { value: 'tile', label: '타일' },
          { value: 'ceiling', label: '천장' },
        ],
      },
      {
        key: 'dry_wet',
        label: '건식/습식',
        type: 'select',
        options: [
          { value: 'dry', label: '건식' },
          { value: 'wet', label: '습식' },
        ],
      },
      {
        key: 'waterproof_included',
        label: '방수 포함 여부',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'yes', label: '포함' },
          { value: 'no', label: '미포함' },
        ],
      },
      { key: 'size', label: '욕실 사이즈', type: 'dimension', unit: 'mm', unknown: 'measure' },
      NOTE_FIELD,
    ],
  },

  // ─── 쇼파·가구 (기존 자산 이식 — details 키 = 구 quote_requests 컬럼명) ──
  // ⚠️ Phase 6 데이터 이관 호환을 위해 키 이름을 기존 컬럼과 1:1로 맞췄다.
  sofa: {
    category: 'sofa',
    group: '가구·소품',
    label: '쇼파·가구',
    version: 1,
    fields: [
      {
        key: 'sofa_type',
        label: '형태',
        type: 'select',
        required: true,
        options: [
          { value: 'straight', label: '직선형 (1자)' },
          { value: 'l_shape', label: 'ㄱ자형' },
          { value: 'u_shape', label: 'ㄷ자형' },
          { value: 'round', label: '원형' },
          { value: 'etc', label: '기타' },
        ],
      },
      { key: 'sofa_count', label: '수량', type: 'number', required: true, unit: '개' },
      { key: 'seat_count', label: '좌석 수', type: 'number', unit: '인' },
      {
        key: 'backrest_height',
        label: '등받이 높이',
        type: 'select',
        options: [
          { value: 'high', label: '하이백 (90cm↑)' },
          { value: 'mid', label: '미디백 (70~90cm)' },
          { value: 'low', label: '로우백 (~70cm)' },
        ],
      },
      {
        key: 'cushion_type',
        label: '쿠션 타입',
        type: 'select',
        options: [
          { value: 'spring', label: '스프링' },
          { value: 'foam', label: '폼' },
          { value: 'mixed', label: '혼합' },
        ],
      },
      {
        key: 'frame_structure',
        label: '프레임 구조',
        type: 'select',
        options: [
          { value: 'wood', label: '목재' },
          { value: 'metal', label: '철재' },
          { value: 'mixed', label: '혼합' },
        ],
      },
      {
        key: 'fabric_type',
        label: '원단 종류',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'fabric', label: '패브릭' },
          { value: 'leather', label: '천연 가죽' },
          { value: 'faux_leather', label: '인조 가죽' },
          { value: 'velvet', label: '벨벳' },
          { value: 'etc', label: '기타' },
        ],
      },
      {
        key: 'inner_material',
        label: '내부 충전재',
        type: 'select',
        options: [
          { value: 'high_density_foam', label: '고밀도 폼' },
          { value: 'spring_foam', label: '스프링 + 폼' },
          { value: 'cotton', label: '솜' },
          { value: 'etc', label: '기타' },
        ],
      },
      {
        key: 'frame_material',
        label: '프레임 재질',
        type: 'select',
        options: [
          { value: 'plywood', label: '합판' },
          { value: 'solid_wood', label: '원목' },
          { value: 'metal', label: '철재' },
          { value: 'etc', label: '기타' },
        ],
      },
      { key: 'color_code', label: '색상 코드/색상명', type: 'text', placeholder: '예) #F5F5DC, 베이지' },
      { key: 'flame_retardant', label: '방염 처리', type: 'boolean' },
      { key: 'waterproof', label: '방수 처리', type: 'boolean' },
      { key: 'has_armrest', label: '팔걸이', type: 'boolean' },
      { key: 'total_length', label: '전체 길이', type: 'number', unit: 'mm' },
      { key: 'total_width', label: '전체 폭', type: 'number', unit: 'mm' },
      { key: 'total_height', label: '전체 높이', type: 'number', unit: 'mm' },
      { key: 'seat_height', label: '좌면 높이', type: 'number', unit: 'mm' },
      { key: 'seat_depth', label: '좌면 깊이', type: 'number', unit: 'mm' },
      NOTE_FIELD,
    ],
  },
}

/** 등록된 분야 스키마 조회. 미등록이면 undefined. */
export function getCategorySchema(category: CategoryKey): CategorySchema | undefined {
  return FIELD_SCHEMAS[category]
}

/** 현재 스키마가 등록(오픈)된 분야인지 */
export function isSchemaReady(category: CategoryKey): boolean {
  return category in FIELD_SCHEMAS
}

/** 스키마가 준비된 분야 key 목록 */
export function readyCategories(): CategoryKey[] {
  return Object.keys(FIELD_SCHEMAS) as CategoryKey[]
}
