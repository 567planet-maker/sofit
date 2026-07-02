'use client'

// ============================================================
// 좌측 분야 선택 사이드바 (Phase 4)
// 공통 정보 고정(진행률 링) + 분야 그룹 복수선택 + 분야별 진행률.
// 스키마가 준비된 분야만 선택 가능(나머지는 "준비 중").
// ============================================================

import { CATEGORY_GROUPS, type CategoryKey } from '@/app/customer/request/schema/categories'
import { isSchemaReady } from '@/app/customer/request/schema/fieldSchemas'
import ProgressRing from './ProgressRing'

type Stat = { filled: number; total: number }

export default function CategorySidebar({
  selected,
  commonStat,
  categoryStat,
  onToggle,
}: {
  selected: Set<CategoryKey>
  commonStat: Stat
  categoryStat: Record<string, Stat>
  onToggle: (category: CategoryKey) => void
}) {
  const commonDone = commonStat.total > 0 && commonStat.filled >= commonStat.total

  return (
    <nav>
      {/* 공통 정보 (고정) */}
      <div className="mb-5 flex items-center gap-3.5 rounded-card border border-brand-tint-strong bg-brand-tint/40 px-[18px] py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          {commonDone ? (
            <span className="text-sm font-extrabold text-success">✓</span>
          ) : (
            <ProgressRing filled={commonStat.filled} total={commonStat.total} size={40} stroke={3} />
          )}
        </div>
        <div>
          <div className="text-[15.5px] font-bold text-ink">공통 정보</div>
          <div className="mt-0.5 text-[13px] font-semibold text-brand">
            {commonStat.filled}/{commonStat.total} 완료
          </div>
        </div>
      </div>

      {/* 분야 그룹 */}
      <div className="flex flex-col gap-[22px]">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="mx-1.5 mb-2.5 text-[11.5px] font-bold uppercase tracking-[.05em] text-ink-subtle">
              {group.group}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.categories.map((cat) => {
                const ready = isSchemaReady(cat.key)
                const isSelected = selected.has(cat.key)
                const stat = categoryStat[cat.key] ?? { filled: 0, total: 0 }
                const done = stat.total > 0 && stat.filled >= stat.total
                return (
                  <label
                    key={cat.key}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors ${
                      !ready
                        ? 'cursor-not-allowed opacity-55'
                        : isSelected
                          ? 'cursor-pointer bg-brand-tint/50 hover:bg-brand-tint/75'
                          : 'cursor-pointer hover:bg-surface-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!ready}
                      onChange={() => ready && onToggle(cat.key)}
                      className="h-[18px] w-[18px] shrink-0 rounded accent-brand disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">
                      {cat.label}
                    </span>
                    {!ready ? (
                      <span className="shrink-0 rounded-pill bg-surface-muted px-2 py-[3px] text-[11px] font-bold text-ink-muted">
                        준비 중
                      </span>
                    ) : isSelected ? (
                      <span className="flex shrink-0 items-center gap-1.5">
                        <ProgressRing filled={stat.filled} total={stat.total} size={20} stroke={2.4} />
                        <span
                          className={`min-w-[28px] text-right text-[12.5px] font-bold tabular-nums ${
                            done ? 'text-success' : 'text-ink-muted'
                          }`}
                        >
                          {stat.filled}/{stat.total}
                        </span>
                      </span>
                    ) : null}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
