// ============================================================
// 분야 item 1개를 스키마 기반으로 읽기 렌더 (Phase 5의 핵심)
// 고객/공장/관리자 상세 화면이 모두 이 컴포넌트를 재사용한다.
// 분야가 늘어도 이 컴포넌트는 수정하지 않는다 (FIELD_SCHEMAS만 추가).
// ============================================================

import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import { isCategoryKey } from '@/app/customer/request/schema/categories'
import { renderFieldValue } from './renderFieldValue'

export default function CategoryItemView({
  item,
}: {
  item: { category: string; details: Record<string, unknown> }
}) {
  if (!isCategoryKey(item.category)) return null
  const schema = getCategorySchema(item.category)
  if (!schema) return null

  const rows = schema.fields
    .map((f) => ({ def: f, node: renderFieldValue(f, item.details?.[f.key]) }))
    .filter((r) => r.node !== null)

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-brand">{schema.group}</span>
        <h3 className="font-semibold text-ink">{schema.label}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-subtle">작성된 상세 내용이 없습니다.</p>
      ) : (
        <dl className="space-y-2">
          {rows.map((r) => (
            <div key={r.def.key} className="flex gap-2 text-sm">
              <dt className="w-32 flex-shrink-0 text-ink-subtle">{r.def.label}</dt>
              <dd className="font-medium text-ink">{r.node}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
