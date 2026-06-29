'use client'

// ============================================================
// 좌측 분야 선택 사이드바 (Phase 4)
// 공통 정보 고정 + 분야 그룹 복수선택 + 진행률 표시.
// 스키마가 준비된 분야만 선택 가능(나머지는 "준비 중").
// ============================================================

import { CATEGORY_GROUPS, type CategoryKey } from '@/app/customer/request/schema/categories'
import { isSchemaReady } from '@/app/customer/request/schema/fieldSchemas'

function ProgressDot({ percent }: { percent: number }) {
  if (percent >= 100) return <span className="text-xs font-semibold text-success">✓</span>
  return <span className="text-xs tabular-nums text-ink-subtle">{percent}%</span>
}

export default function CategorySidebar({
  selected,
  commonPercent,
  categoryPercent,
  onToggle,
}: {
  selected: Set<CategoryKey>
  commonPercent: number
  categoryPercent: Record<string, number>
  onToggle: (category: CategoryKey) => void
}) {
  return (
    <nav className="space-y-5">
      {/* 공통 정보 (고정) */}
      <div className="flex w-full items-center justify-between rounded-card border border-brand-tint-strong bg-brand-tint/40 px-3 py-2.5">
        <span className="text-sm font-medium text-brand">공통 정보</span>
        <ProgressDot percent={commonPercent} />
      </div>

      {/* 분야 그룹 */}
      {CATEGORY_GROUPS.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            {group.group}
          </p>
          <ul className="space-y-1">
            {group.categories.map((cat) => {
              const ready = isSchemaReady(cat.key)
              const isSelected = selected.has(cat.key)
              return (
                <li key={cat.key}>
                  <div
                    className={`flex items-center gap-2 rounded-control px-2 py-1.5 ${
                      isSelected ? 'bg-surface-muted' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!ready}
                      onChange={() => ready && onToggle(cat.key)}
                      className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => ready && onToggle(cat.key)}
                      className={`flex flex-1 items-center justify-between text-left text-sm ${
                        ready ? 'text-ink' : 'cursor-not-allowed text-ink-subtle'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {!ready ? (
                        <span className="text-[11px] text-ink-subtle">준비 중</span>
                      ) : isSelected ? (
                        <ProgressDot percent={categoryPercent[cat.key] ?? 0} />
                      ) : null}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
