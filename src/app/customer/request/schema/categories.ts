// ============================================================
// 인테리어 분야(카테고리) 체계 — 설계안 B 기준 (Phase 0)
// 공정 흐름(철거→골조→마감→설비→가구→사인→마무리) 순으로 정렬.
// 이 순서가 그대로 좌측 사이드바 정렬 순서가 된다.
// ============================================================

export type CategoryKey =
  // 1. 철거·기초
  | 'demolition'
  | 'waste'
  | 'plumbing'
  | 'waterproofing'
  // 2. 골조·목공
  | 'carpentry'
  | 'metal'
  | 'glass'
  | 'window'
  | 'interior_door'
  // 3. 마감
  | 'flooring'
  | 'tile'
  | 'wallpaper'
  | 'painting'
  | 'film'
  // 4. 설비·전기
  | 'electrical'
  | 'lighting'
  | 'hvac'
  // 5. 공간 가구
  | 'kitchen'
  | 'bathroom'
  | 'builtin'
  // 6. 가구·소품
  | 'sofa'
  | 'curtain'
  | 'appliance'
  // 7. 사인·외부
  | 'signage'
  | 'signboard'
  | 'landscaping'
  // 8. 마무리
  | 'cleaning'

export interface CategoryMeta {
  key: CategoryKey
  label: string
}

export interface CategoryGroup {
  /** 그룹 정렬 순서 (1~8) */
  order: number
  group: string
  categories: CategoryMeta[]
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    order: 1,
    group: '철거·기초',
    categories: [
      { key: 'demolition', label: '철거' },
      { key: 'waste', label: '폐기물 처리' },
      { key: 'plumbing', label: '설비(급배수·배관)' },
      { key: 'waterproofing', label: '방수' },
    ],
  },
  {
    order: 2,
    group: '골조·목공',
    categories: [
      { key: 'carpentry', label: '목공' },
      { key: 'metal', label: '금속' },
      { key: 'glass', label: '유리' },
      { key: 'window', label: '창호' },
      { key: 'interior_door', label: '중문' },
    ],
  },
  {
    order: 3,
    group: '마감',
    categories: [
      { key: 'flooring', label: '바닥' },
      { key: 'tile', label: '타일' },
      { key: 'wallpaper', label: '도배' },
      { key: 'painting', label: '도장' },
      { key: 'film', label: '필름·시트' },
    ],
  },
  {
    order: 4,
    group: '설비·전기',
    categories: [
      { key: 'electrical', label: '전기·배선' },
      { key: 'lighting', label: '조명' },
      { key: 'hvac', label: '냉난방' },
    ],
  },
  {
    order: 5,
    group: '공간 가구',
    categories: [
      { key: 'kitchen', label: '주방' },
      { key: 'bathroom', label: '욕실' },
      { key: 'builtin', label: '붙박이·수납' },
    ],
  },
  {
    order: 6,
    group: '가구·소품',
    categories: [
      { key: 'sofa', label: '쇼파·가구' },
      { key: 'curtain', label: '커튼·블라인드' },
      { key: 'appliance', label: '가전' },
    ],
  },
  {
    order: 7,
    group: '사인·외부',
    categories: [
      { key: 'signage', label: '간판' },
      { key: 'signboard', label: '사인물' },
      { key: 'landscaping', label: '조경·플랜테리어' },
    ],
  },
  {
    order: 8,
    group: '마무리',
    categories: [{ key: 'cleaning', label: '청소' }],
  },
]

// ─── 파생 헬퍼 ───────────────────────────────────────────────

/** 전체 분야 메타를 평탄화 (사이드바 정렬 순서 유지) */
export const ALL_CATEGORIES: CategoryMeta[] = CATEGORY_GROUPS.flatMap((g) => g.categories)

/** key → 표시명 (예: 'carpentry' → '목공') */
export const CATEGORY_LABELS: Record<CategoryKey, string> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.key, c.label]),
) as Record<CategoryKey, string>

/** key → 소속 그룹명 (예: 'carpentry' → '골조·목공') */
export const CATEGORY_GROUP_OF: Record<CategoryKey, string> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((g) => g.categories.map((c) => [c.key, g.group])),
) as Record<CategoryKey, string>

export function isCategoryKey(value: string): value is CategoryKey {
  return value in CATEGORY_LABELS
}
