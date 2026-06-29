// ============================================================
// 공통 정보 읽기 렌더 (Phase 5) — 신규 다분야 요청의 공통 컬럼 표시.
// 신규 스키마 컬럼이 하나도 없으면(레거시 요청) null 반환 →
// 기존 레거시 "현장 정보" 섹션이 대신 표시되도록 둔다. (Phase 6에서 통합)
// ============================================================

import { COMMON_SCHEMA, COMMON_COLUMN_MAP } from '@/app/customer/request/schema/commonSchema'
import { renderFieldValue } from './renderFieldValue'

// 신규 흐름에서만 채워지는 컬럼 (레거시 요청 판별용)
const NEW_ONLY_COLUMNS = [
  'site_address',
  'contact_name',
  'contact_phone',
  'building_type',
  'space_status',
  'area_m2',
  'total_floors',
  'is_occupied',
  'desired_start_date',
  'desired_end_date',
  'budget_range',
  'special_requests',
]

export function isNewSchemaRequest(request: Record<string, unknown>): boolean {
  return NEW_ONLY_COLUMNS.some((c) => {
    const v = request[c]
    return v !== null && v !== undefined && v !== ''
  })
}

export default function QuoteRequestView({
  request,
  className,
}: {
  request: Record<string, unknown>
  className?: string
}) {
  if (!isNewSchemaRequest(request)) return null

  return (
    <section className={className}>
      <h2 className="mb-4 font-semibold text-ink">공통 정보</h2>
      <div className="space-y-5">
        {COMMON_SCHEMA.map((sec) => {
          const rows = sec.fields
            .map((f) => ({
              def: f,
              node: renderFieldValue(f, request[COMMON_COLUMN_MAP[f.key] ?? f.key]),
            }))
            .filter((r) => r.node !== null)
          if (rows.length === 0) return null
          return (
            <div key={sec.id}>
              <h3 className="mb-2 text-sm font-medium text-ink-muted">{sec.label}</h3>
              <dl className="space-y-2">
                {rows.map((r) => (
                  <div key={r.def.key} className="flex gap-2 text-sm">
                    <dt className="w-32 flex-shrink-0 text-ink-subtle">{r.def.label}</dt>
                    <dd className="font-medium text-ink">{r.node}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}
