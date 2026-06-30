// ============================================================
// 관리자 통계 — 분야별 수요(견적 요청) vs 공장 커버리지 (Phase 8 3차)
// 요청은 있는데 시공 가능 공장이 없는 분야 = 공장 영입 우선순위.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { ALL_CATEGORIES, CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'

type ItemRow = { category: string }
type FcRow = { category: string }

export default async function CategoryDemandStats() {
  const supabase = await createClient()

  const [{ data: itemData }, { data: fcData }] = await Promise.all([
    // 수요: 제출(draft 제외)된 요청의 분야 item
    supabase
      .from('quote_request_items')
      .select('category, quote_requests!inner(status)')
      .neq('quote_requests.status', 'draft'),
    // 커버리지: active 공장의 분야 태그
    supabase
      .from('factory_categories')
      .select('category, factories!inner(status)')
      .eq('factories.status', 'active'),
  ])

  const demand = new Map<string, number>()
  for (const r of (itemData ?? []) as ItemRow[]) {
    demand.set(r.category, (demand.get(r.category) ?? 0) + 1)
  }
  const coverage = new Map<string, number>()
  for (const r of (fcData ?? []) as FcRow[]) {
    coverage.set(r.category, (coverage.get(r.category) ?? 0) + 1)
  }

  // 수요 또는 커버리지가 있는 분야만, 공정 순서대로
  const rows = ALL_CATEGORIES.map((c) => ({
    key: c.key as CategoryKey,
    label: c.label,
    demand: demand.get(c.key) ?? 0,
    coverage: coverage.get(c.key) ?? 0,
  })).filter((r) => r.demand > 0 || r.coverage > 0)

  const maxDemand = Math.max(1, ...rows.map((r) => r.demand))
  const gaps = rows.filter((r) => r.demand > 0 && r.coverage === 0)

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-semibold text-ink">분야별 수요 · 공장 커버리지</h2>

      {rows.length === 0 ? (
        <p className="rounded-card border border-border bg-surface py-8 text-center text-sm text-ink-subtle shadow-card">
          아직 집계할 분야 데이터가 없습니다.
        </p>
      ) : (
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          {gaps.length > 0 && (
            <div className="mb-4 rounded-card border border-warning/30 bg-warning-tint/40 px-4 py-2.5 text-sm text-warning">
              ⚠️ <b>시공 공장이 없는 요청 분야 {gaps.length}개</b> —{' '}
              {gaps.map((g) => CATEGORY_LABELS[g.key]).join(', ')} (공장 영입 우선)
            </div>
          )}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center gap-3 text-sm">
                <span className="w-24 flex-shrink-0 truncate text-ink-muted">{r.label}</span>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${r.coverage === 0 ? 'bg-danger' : 'bg-brand'}`}
                    style={{ width: `${(r.demand / maxDemand) * 100}%` }}
                  />
                </div>
                <span className="w-12 flex-shrink-0 text-right font-medium text-ink">
                  {r.demand}건
                </span>
                <span
                  className={`w-20 flex-shrink-0 text-right text-xs ${
                    r.coverage === 0 && r.demand > 0 ? 'font-medium text-danger' : 'text-ink-subtle'
                  }`}
                >
                  공장 {r.coverage}곳
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
