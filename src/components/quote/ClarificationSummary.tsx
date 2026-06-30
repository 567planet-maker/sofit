// ============================================================
// "모름/상담/현장확인/실측" 확인 필요 항목 요약 (Phase 8)
// 고객이 안전장치로 넘긴 항목을 관리자(·공장)가 한눈에 보고 보완 요청.
// 분야 item.details 만 스캔(공통 scalar는 unknown 미사용).
// ============================================================

import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import { isCategoryKey, CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'
import { isUnknownValue, type UnknownMode } from '@/app/customer/request/schema/types'

const REASON: Record<UnknownMode, { label: string; cls: string }> = {
  unknown: { label: '잘 모름', cls: 'bg-surface-muted text-ink-muted' },
  consult: { label: '추천 요청', cls: 'bg-brand-tint text-brand' },
  site_check: { label: '현장 확인 필요', cls: 'bg-warning-tint text-warning' },
  measure: { label: '실측 요청', cls: 'bg-warning-tint text-warning' },
}

type Item = { category: string; details: Record<string, unknown> }

export default function ClarificationSummary({
  items,
  className = 'rounded-card border border-warning/30 bg-warning-tint/40 p-5',
}: {
  items: Item[]
  className?: string
}) {
  const groups: { category: CategoryKey; label: string; fields: { label: string; reason: UnknownMode }[] }[] = []

  for (const item of items) {
    if (!isCategoryKey(item.category)) continue
    const schema = getCategorySchema(item.category)
    if (!schema) continue
    const fields: { label: string; reason: UnknownMode }[] = []
    for (const f of schema.fields) {
      const v = item.details?.[f.key]
      if (isUnknownValue(v)) fields.push({ label: f.label, reason: v.reason })
    }
    if (fields.length > 0) {
      groups.push({ category: item.category, label: CATEGORY_LABELS[item.category], fields })
    }
  }

  const total = groups.reduce((n, g) => n + g.fields.length, 0)
  if (total === 0) return null

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg leading-none">⚠️</span>
        <h3 className="text-sm font-semibold text-ink">확인 필요 항목 {total}개</h3>
        <span className="text-xs text-ink-subtle">고객이 모름·상담·실측으로 표시한 항목</span>
      </div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.category}>
            <p className="mb-1.5 text-xs font-semibold text-ink">{g.label}</p>
            <ul className="flex flex-wrap gap-1.5">
              {g.fields.map((f, i) => (
                <li
                  key={`${f.label}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs ring-1 ring-border"
                >
                  <span className="font-medium text-ink">{f.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${REASON[f.reason].cls}`}>
                    {REASON[f.reason].label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
