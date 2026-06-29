'use client'

// ============================================================
// 분야 1개 입력 섹션 (Phase 4) — FIELD_SCHEMAS 기반 동적 렌더
// ============================================================

import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import type { CategoryKey } from '@/app/customer/request/schema/categories'
import DynamicField from './DynamicField'

export default function CategorySection({
  category,
  values,
  onChange,
  onRemove,
  invalidKeys,
}: {
  category: CategoryKey
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  onRemove: () => void
  invalidKeys: Set<string>
}) {
  const schema = getCategorySchema(category)
  if (!schema) return null

  return (
    <section
      id={`section-${category}`}
      className="scroll-mt-24 rounded-card bg-white p-6 shadow-card ring-1 ring-border"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-brand">{schema.group}</span>
          <h2 className="text-lg font-semibold text-ink">{schema.label}</h2>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-control px-3 py-1.5 text-sm text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
        >
          분야 제거
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.map((f) => (
          <div
            key={f.key}
            className={
              f.type === 'textarea' || f.type === 'multiselect' || f.type === 'address'
                ? 'sm:col-span-2'
                : ''
            }
          >
            <DynamicField
              def={f}
              value={values[f.key]}
              onChange={(v) => onChange(f.key, v)}
              invalid={invalidKeys.has(f.key)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
