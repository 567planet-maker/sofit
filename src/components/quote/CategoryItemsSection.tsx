// ============================================================
// 분야별 요청 내용 섹션 (Phase 5) — items 배열을 받아 카드로 나열.
// 항목이 없으면(레거시 요청 등) 아무것도 렌더하지 않는다.
// ============================================================

import CategoryItemView from './CategoryItemView'

export default function CategoryItemsSection({
  items,
  className,
}: {
  items: Array<{ category: string; details: Record<string, unknown> }>
  className?: string
}) {
  if (!items || items.length === 0) return null
  return (
    <section className={className}>
      <h2 className="mb-4 font-semibold text-ink">분야별 요청 내용</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <CategoryItemView key={item.category} item={item} />
        ))}
      </div>
    </section>
  )
}
