'use client'

// ============================================================
// 공통 정보 입력 섹션 (Phase 4) — COMMON_SCHEMA 기반
// ============================================================

import { COMMON_SCHEMA, COMMON_FIELDS } from '@/app/customer/request/schema/commonSchema'
import DynamicField from './DynamicField'
import { requiredStats, isFullWidthField } from './helpers'

export default function CommonInfoSection({
  values,
  onChange,
  invalidKeys,
}: {
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  invalidKeys: Set<string>
}) {
  const { filled, total } = requiredStats(COMMON_FIELDS, values)

  return (
    <section
      id="section-common"
      className="scroll-mt-24 rounded-card border border-border bg-white px-[30px] py-7 shadow-card"
    >
      <div className="mb-[22px] flex items-baseline gap-2">
        <h2 className="text-lg font-bold tracking-[-.01em] text-ink">공통 정보</h2>
        <span className="text-[12.5px] font-semibold text-ink-muted">
          ({filled}/{total} 완료)
        </span>
      </div>

      {COMMON_SCHEMA.map((sec, i) => (
        <div key={sec.id} className={i > 0 ? 'mt-[26px] border-t border-border pt-[26px]' : ''}>
          <div className="mb-4 flex items-baseline gap-2.5">
            <span className="text-sm font-bold text-ink">{sec.label}</span>
            {sec.required && <span className="text-xs font-semibold text-ink-subtle">필수</span>}
          </div>
          <div className="grid grid-cols-1 gap-x-[22px] gap-y-5 sm:grid-cols-2">
            {sec.fields.map((f) => (
              <div key={f.key} className={isFullWidthField(f.type) ? 'sm:col-span-2' : ''}>
                <DynamicField
                  def={f}
                  value={values[f.key]}
                  onChange={(v) => onChange(f.key, v)}
                  invalid={invalidKeys.has(f.key)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
