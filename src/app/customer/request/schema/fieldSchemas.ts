// ============================================================
// 분야별 필드 스키마 레지스트리 — 설계안 D / K-1
//
// Phase 2: 빈도 높은 8개 분야 완성
//   carpentry·flooring·wallpaper·painting·lighting·kitchen·bathroom·sofa
// Phase 8: 나머지 19개 분야 추가 → CATEGORY_GROUPS 27개 전부 오픈.
// 분야 추가 = 이 레지스트리에 CategorySchema 한 덩어리 추가로 끝(폼·뷰 자동 반영).
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

  // ─── 철거 ───────────────────────────────────────────────
  demolition: {
    category: 'demolition',
    group: '철거·기초',
    label: '철거',
    version: 1,
    fields: [
      {
        key: 'demo_scope',
        label: '철거 범위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'full', label: '전체 철거' },
          { value: 'wall', label: '벽체' },
          { value: 'floor', label: '바닥' },
          { value: 'ceiling', label: '천장' },
          { value: 'bathroom', label: '욕실' },
          { value: 'kitchen', label: '주방' },
        ],
      },
      { key: 'area', label: '철거 면적', type: 'number', unit: 'm2' },
      {
        key: 'structure_type',
        label: '구조 형태',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'masonry', label: '조적' },
          { value: 'concrete', label: '콘크리트' },
          { value: 'light_frame', label: '경량' },
          { value: 'wood', label: '목구조' },
        ],
        help: '벽체 철거 시 구조 확인이 필요합니다.',
      },
      {
        key: 'asbestos',
        label: '석면 의심 자재',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'yes', label: '있음' },
          { value: 'no', label: '없음' },
        ],
      },
      { key: 'debris_included', label: '폐기물 반출 포함', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 폐기물 처리 ─────────────────────────────────────────
  waste: {
    category: 'waste',
    group: '철거·기초',
    label: '폐기물 처리',
    version: 1,
    fields: [
      {
        key: 'waste_types',
        label: '폐기물 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'construction', label: '건축 폐기물' },
          { value: 'household', label: '생활 폐기물' },
          { value: 'furniture', label: '대형 가구' },
          { value: 'appliance', label: '폐가전' },
          { value: 'hazardous', label: '위험물' },
        ],
      },
      {
        key: 'volume',
        label: '예상 배출량',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'under_1t', label: '1톤 미만' },
          { value: '1_5t', label: '1~5톤' },
          { value: 'over_5t', label: '5톤 이상' },
        ],
      },
      {
        key: 'access',
        label: '반출 동선',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'elevator', label: '엘리베이터' },
          { value: 'stairs', label: '계단' },
          { value: 'ladder_truck', label: '사다리차' },
        ],
      },
      { key: 'urgent', label: '긴급 처리', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 설비(급배수·배관) ───────────────────────────────────
  plumbing: {
    category: 'plumbing',
    group: '철거·기초',
    label: '설비(급배수·배관)',
    version: 1,
    fields: [
      {
        key: 'work_items',
        label: '작업 항목',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'supply', label: '급수' },
          { value: 'drain', label: '배수' },
          { value: 'heating_pipe', label: '난방 배관' },
          { value: 'gas', label: '가스' },
          { value: 'fixture', label: '위생기구' },
        ],
      },
      {
        key: 'pipe_material',
        label: '배관 자재',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'pb', label: 'PB' },
          { value: 'pvc', label: 'PVC' },
          { value: 'stainless', label: '스테인리스' },
          { value: 'copper', label: '동관' },
        ],
      },
      { key: 'relocate', label: '배관 위치 이동', type: 'boolean' },
      { key: 'boiler_included', label: '보일러 포함', type: 'boolean' },
      {
        key: 'issue',
        label: '누수·막힘 문제',
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

  // ─── 방수 ───────────────────────────────────────────────
  waterproofing: {
    category: 'waterproofing',
    group: '철거·기초',
    label: '방수',
    version: 1,
    fields: [
      {
        key: 'waterproof_area',
        label: '방수 부위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'bathroom', label: '욕실' },
          { value: 'veranda', label: '베란다' },
          { value: 'rooftop', label: '옥상' },
          { value: 'kitchen', label: '주방' },
          { value: 'basement', label: '지하' },
        ],
      },
      {
        key: 'method',
        label: '방수 공법',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'membrane', label: '도막' },
          { value: 'sheet', label: '시트' },
          { value: 'complex', label: '복합' },
          { value: 'penetrating', label: '침투' },
        ],
      },
      { key: 'area', label: '시공 면적', type: 'number', unit: 'm2' },
      { key: 'crack_repair', label: '균열 보수 포함', type: 'boolean' },
      {
        key: 'existing_leak',
        label: '기존 누수',
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

  // ─── 금속 ───────────────────────────────────────────────
  metal: {
    category: 'metal',
    group: '골조·목공',
    label: '금속',
    version: 1,
    fields: [
      {
        key: 'work_items',
        label: '작업 항목',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'railing', label: '난간' },
          { value: 'stair', label: '계단' },
          { value: 'frame', label: '프레임' },
          { value: 'steel_door', label: '철문' },
          { value: 'reinforce', label: '구조 보강' },
        ],
      },
      { key: 'install_location', label: '설치 위치', type: 'text', required: true },
      {
        key: 'material',
        label: '재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'stainless', label: '스테인리스' },
          { value: 'steel', label: '철' },
          { value: 'aluminum', label: '알루미늄' },
          { value: 'galvanized', label: '아연도금' },
        ],
      },
      {
        key: 'finish',
        label: '마감',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'paint', label: '도장' },
          { value: 'powder', label: '분체도장' },
          { value: 'hairline', label: '헤어라인' },
        ],
      },
      { key: 'size', label: '규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      NOTE_FIELD,
    ],
  },

  // ─── 유리 ───────────────────────────────────────────────
  glass: {
    category: 'glass',
    group: '골조·목공',
    label: '유리',
    version: 1,
    fields: [
      {
        key: 'work_items',
        label: '작업 항목',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'partition', label: '파티션' },
          { value: 'door', label: '도어' },
          { value: 'shower_booth', label: '샤워부스' },
          { value: 'railing', label: '난간' },
          { value: 'glass_wall', label: '유리벽' },
        ],
      },
      {
        key: 'glass_type',
        label: '유리 종류',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'tempered', label: '강화' },
          { value: 'laminated', label: '접합' },
          { value: 'pair', label: '복층' },
          { value: 'wired', label: '망입' },
          { value: 'color', label: '컬러' },
        ],
      },
      {
        key: 'thickness',
        label: '두께',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: '5', label: '5mm' },
          { value: '8', label: '8mm' },
          { value: '10', label: '10mm' },
          { value: '12', label: '12mm' },
        ],
      },
      { key: 'size', label: '규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      { key: 'frame_included', label: '프레임 포함', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 창호 ───────────────────────────────────────────────
  window: {
    category: 'window',
    group: '골조·목공',
    label: '창호',
    version: 1,
    fields: [
      {
        key: 'window_type',
        label: '창호 종류',
        type: 'select',
        required: true,
        unknown: 'consult',
        options: [
          { value: 'double', label: '이중창' },
          { value: 'single', label: '단창' },
          { value: 'system', label: '시스템창' },
          { value: 'balcony', label: '발코니창' },
        ],
      },
      { key: 'count', label: '창 개수', type: 'number', required: true, unit: '개' },
      {
        key: 'frame_material',
        label: '프레임 재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'pvc', label: 'PVC' },
          { value: 'aluminum', label: '알루미늄' },
          { value: 'hybrid', label: '하이브리드' },
        ],
      },
      {
        key: 'glass_spec',
        label: '유리 사양',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'pair', label: '복층' },
          { value: 'triple', label: '삼중' },
          { value: 'lowe', label: '로이' },
        ],
      },
      { key: 'size', label: '창 규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      { key: 'remove_existing', label: '기존 창 철거', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 중문 ───────────────────────────────────────────────
  interior_door: {
    category: 'interior_door',
    group: '골조·목공',
    label: '중문',
    version: 1,
    fields: [
      {
        key: 'door_type',
        label: '중문 형태',
        type: 'select',
        required: true,
        unknown: 'consult',
        options: [
          { value: 'sliding', label: '슬라이딩' },
          { value: 'swing', label: '스윙' },
          { value: 'three_fold', label: '3연동' },
          { value: 'folding', label: '폴딩' },
        ],
      },
      { key: 'count', label: '수량', type: 'number', required: true, unit: '개' },
      {
        key: 'material',
        label: '재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'glass', label: '유리' },
          { value: 'wood', label: '목재' },
          { value: 'aluminum', label: '알루미늄' },
        ],
      },
      { key: 'frame_finish', label: '프레임 색상', type: 'text', placeholder: '예) 화이트, 블랙, 우드' },
      { key: 'size', label: '설치 규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      NOTE_FIELD,
    ],
  },

  // ─── 타일 ───────────────────────────────────────────────
  tile: {
    category: 'tile',
    group: '마감',
    label: '타일',
    version: 1,
    fields: [
      {
        key: 'tile_area',
        label: '시공 부위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'bathroom_wall', label: '욕실 벽' },
          { value: 'bathroom_floor', label: '욕실 바닥' },
          { value: 'kitchen', label: '주방' },
          { value: 'entrance', label: '현관' },
          { value: 'veranda', label: '베란다' },
          { value: 'living', label: '거실' },
        ],
      },
      { key: 'area', label: '시공 면적', type: 'number', required: true, unit: 'm2' },
      {
        key: 'tile_type',
        label: '타일 종류',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'porcelain', label: '자기질' },
          { value: 'ceramic', label: '도기질' },
          { value: 'porcelain_large', label: '포세린' },
          { value: 'mosaic', label: '모자이크' },
        ],
      },
      {
        key: 'tile_size',
        label: '타일 규격',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: '300', label: '300각' },
          { value: '600', label: '600각' },
          { value: '600x1200', label: '600x1200' },
          { value: 'etc', label: '기타' },
        ],
      },
      { key: 'remove_existing', label: '기존 타일 철거', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 필름·시트 ──────────────────────────────────────────
  film: {
    category: 'film',
    group: '마감',
    label: '필름·시트',
    version: 1,
    fields: [
      {
        key: 'film_areas',
        label: '시공 부위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'furniture', label: '가구' },
          { value: 'door', label: '문' },
          { value: 'wall', label: '벽' },
          { value: 'window_frame', label: '창틀' },
          { value: 'sink', label: '싱크대' },
        ],
      },
      {
        key: 'film_type',
        label: '필름 종류',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'solid', label: '단색' },
          { value: 'wood', label: '우드' },
          { value: 'metal', label: '메탈' },
          { value: 'marble', label: '대리석' },
          { value: 'matte', label: '무광' },
        ],
      },
      { key: 'area', label: '시공 면적', type: 'number', unit: 'm2' },
      {
        key: 'existing_condition',
        label: '바탕 상태',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'flat', label: '평탄' },
          { value: 'uneven', label: '요철 있음' },
        ],
      },
      { key: 'color', label: '희망 색상/패턴', type: 'text' },
      NOTE_FIELD,
    ],
  },

  // ─── 전기·배선 ──────────────────────────────────────────
  electrical: {
    category: 'electrical',
    group: '설비·전기',
    label: '전기·배선',
    version: 1,
    fields: [
      {
        key: 'work_items',
        label: '작업 항목',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'wiring', label: '배선' },
          { value: 'outlet', label: '콘센트' },
          { value: 'switch', label: '스위치' },
          { value: 'panel', label: '분전반' },
          { value: 'network', label: '통신' },
          { value: 'cctv', label: 'CCTV' },
        ],
      },
      { key: 'outlet_add', label: '콘센트·스위치 추가 수량', type: 'number', unit: '개', unknown: 'consult' },
      {
        key: 'conceal',
        label: '배선 방식',
        type: 'select',
        options: [
          { value: 'embedded', label: '매립' },
          { value: 'exposed', label: '노출' },
        ],
      },
      { key: 'capacity_upgrade', label: '증설·승압', type: 'boolean' },
      { key: 'panel_work', label: '분전반 교체', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 냉난방 ─────────────────────────────────────────────
  hvac: {
    category: 'hvac',
    group: '설비·전기',
    label: '냉난방',
    version: 1,
    fields: [
      {
        key: 'equipment',
        label: '장비 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'system_ac', label: '시스템 에어컨' },
          { value: 'wall_ac', label: '벽걸이' },
          { value: 'stand_ac', label: '스탠드' },
          { value: 'boiler', label: '보일러' },
          { value: 'ventilation', label: '환기' },
        ],
      },
      { key: 'count', label: '설치 수량', type: 'number', unit: '개' },
      {
        key: 'capacity',
        label: '용량(평형)',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: '6', label: '6평' },
          { value: '9', label: '9평' },
          { value: '13', label: '13평' },
          { value: '18', label: '18평' },
        ],
      },
      {
        key: 'work_type',
        label: '작업 유형',
        type: 'select',
        options: [
          { value: 'new', label: '신규 설치' },
          { value: 'relocate', label: '이전 설치' },
          { value: 'remove', label: '철거' },
        ],
      },
      { key: 'duct_work', label: '배관·타공 포함', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 붙박이·수납 ────────────────────────────────────────
  builtin: {
    category: 'builtin',
    group: '공간 가구',
    label: '붙박이·수납',
    version: 1,
    fields: [
      {
        key: 'furniture_types',
        label: '가구 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'wardrobe', label: '붙박이장' },
          { value: 'shoe_cabinet', label: '신발장' },
          { value: 'pantry', label: '팬트리' },
          { value: 'bookshelf', label: '책장' },
          { value: 'storage_wall', label: '수납벽' },
          { value: 'dressroom', label: '드레스룸' },
        ],
      },
      { key: 'location', label: '설치 위치', type: 'text', required: true },
      { key: 'size', label: '규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      {
        key: 'door_type',
        label: '도어 방식',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'hinged', label: '여닫이' },
          { value: 'sliding', label: '슬라이딩' },
          { value: 'open', label: '오픈' },
        ],
      },
      {
        key: 'material',
        label: '자재',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'pet', label: 'PET' },
          { value: 'veneer', label: '무늬목' },
          { value: 'film', label: '필름' },
          { value: 'paint', label: '도장' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 커튼·블라인드 ──────────────────────────────────────
  curtain: {
    category: 'curtain',
    group: '가구·소품',
    label: '커튼·블라인드',
    version: 1,
    fields: [
      {
        key: 'product_types',
        label: '제품 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'curtain', label: '커튼' },
          { value: 'combi', label: '콤비 블라인드' },
          { value: 'roll', label: '롤 스크린' },
          { value: 'wood', label: '우드 블라인드' },
          { value: 'honeycomb', label: '허니콤' },
          { value: 'blackout', label: '암막' },
        ],
      },
      { key: 'window_count', label: '창 개수', type: 'number', required: true, unit: '개' },
      { key: 'size', label: '창 규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      {
        key: 'mount',
        label: '설치 방식',
        type: 'select',
        unknown: 'site_check',
        options: [
          { value: 'ceiling', label: '천장' },
          { value: 'wall', label: '벽면' },
          { value: 'frame', label: '창틀' },
        ],
      },
      { key: 'motorized', label: '전동', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 가전 ───────────────────────────────────────────────
  appliance: {
    category: 'appliance',
    group: '가구·소품',
    label: '가전',
    version: 1,
    fields: [
      {
        key: 'appliances',
        label: '가전 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'fridge', label: '냉장고' },
          { value: 'washer', label: '세탁기' },
          { value: 'dryer', label: '건조기' },
          { value: 'dishwasher', label: '식기세척기' },
          { value: 'induction', label: '인덕션' },
          { value: 'oven', label: '오븐' },
          { value: 'tv', label: 'TV' },
        ],
      },
      {
        key: 'install_type',
        label: '설치 형태',
        type: 'select',
        options: [
          { value: 'builtin', label: '빌트인' },
          { value: 'standard', label: '일반 설치' },
        ],
      },
      { key: 'count', label: '수량', type: 'number', unit: '개' },
      { key: 'remove_old', label: '기존 가전 철거', type: 'boolean' },
      { key: 'utility_needed', label: '전기·급배수 연결 필요', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 간판 ───────────────────────────────────────────────
  signage: {
    category: 'signage',
    group: '사인·외부',
    label: '간판',
    version: 1,
    fields: [
      {
        key: 'sign_types',
        label: '간판 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'front', label: '전면 간판' },
          { value: 'projecting', label: '돌출 간판' },
          { value: 'stand', label: '입간판' },
          { value: 'window', label: '윈도우 시트' },
          { value: 'channel', label: '채널' },
        ],
      },
      {
        key: 'material',
        label: '재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'acrylic', label: '아크릴' },
          { value: 'led_channel', label: 'LED 채널' },
          { value: 'galva', label: '갈바' },
          { value: 'flex', label: '플렉스' },
        ],
      },
      { key: 'size', label: '규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      { key: 'lighting', label: '조명 포함', type: 'boolean' },
      { key: 'permit_needed', label: '인허가 대행', type: 'boolean' },
      {
        key: 'design_provided',
        label: '디자인 보유 여부',
        type: 'select',
        options: [
          { value: 'have', label: '보유' },
          { value: 'request', label: '제작 요청' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 사인물 ─────────────────────────────────────────────
  signboard: {
    category: 'signboard',
    group: '사인·외부',
    label: '사인물',
    version: 1,
    fields: [
      {
        key: 'signboard_types',
        label: '사인물 종류',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'indoor', label: '실내 사인' },
          { value: 'guide', label: '유도 사인' },
          { value: 'nameplate', label: '명패' },
          { value: 'poster', label: '포스터' },
          { value: 'sticker', label: '스티커' },
        ],
      },
      { key: 'quantity', label: '수량', type: 'number', unit: '개' },
      {
        key: 'material',
        label: '재질',
        type: 'select',
        unknown: 'consult',
        options: [
          { value: 'acrylic', label: '아크릴' },
          { value: 'forex', label: '포맥스' },
          { value: 'metal', label: '메탈' },
          { value: 'wood', label: '우드' },
          { value: 'sheet', label: '시트' },
        ],
      },
      { key: 'size', label: '규격', type: 'dimension', unit: 'mm', unknown: 'measure' },
      {
        key: 'design_provided',
        label: '디자인 보유 여부',
        type: 'select',
        options: [
          { value: 'have', label: '보유' },
          { value: 'request', label: '제작 요청' },
        ],
      },
      NOTE_FIELD,
    ],
  },

  // ─── 조경·플랜테리어 ────────────────────────────────────
  landscaping: {
    category: 'landscaping',
    group: '사인·외부',
    label: '조경·플랜테리어',
    version: 1,
    fields: [
      {
        key: 'scope',
        label: '작업 범위',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'indoor_plant', label: '실내 플랜테리어' },
          { value: 'outdoor', label: '실외 조경' },
          { value: 'green_wall', label: '벽면 녹화' },
          { value: 'flower_bed', label: '화단' },
          { value: 'tree', label: '조경수' },
          { value: 'artificial_turf', label: '인조 잔디' },
        ],
      },
      { key: 'location', label: '설치 위치', type: 'text', required: true },
      { key: 'area', label: '면적', type: 'number', unit: 'm2' },
      { key: 'plant_preference', label: '선호 식물/스타일', type: 'text', unknown: 'consult' },
      { key: 'maintenance', label: '유지관리 포함', type: 'boolean' },
      NOTE_FIELD,
    ],
  },

  // ─── 청소 ───────────────────────────────────────────────
  cleaning: {
    category: 'cleaning',
    group: '마무리',
    label: '청소',
    version: 1,
    fields: [
      {
        key: 'cleaning_type',
        label: '청소 종류',
        type: 'select',
        required: true,
        options: [
          { value: 'move_in', label: '입주 청소' },
          { value: 'post_construction', label: '준공·리모델링 후' },
          { value: 'office', label: '사무실' },
          { value: 'move_out', label: '이사 청소' },
        ],
      },
      { key: 'area', label: '청소 면적', type: 'number', required: true, unit: 'm2' },
      {
        key: 'options',
        label: '추가 옵션',
        type: 'multiselect',
        options: [
          { value: 'glass', label: '유리' },
          { value: 'grout', label: '줄눈' },
          { value: 'floor_wax', label: '바닥 왁스' },
          { value: 'mold', label: '곰팡이 제거' },
          { value: 'exterior', label: '외부' },
        ],
      },
      { key: 'desired_date', label: '희망일', type: 'date' },
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
