// ============================================================
// 견적 진행 이정표 (Status Stepper)
// 전체 여정(접수→매칭→견적→계약→시공→완료) 중 현재 위치를 표시.
// ============================================================

import type { QuoteRequestStatus } from '@/types'

type Milestone = { label: string; statuses: QuoteRequestStatus[] }

const MILESTONES: Milestone[] = [
  { label: '접수', statuses: ['submitted', 'reviewing'] },
  { label: '매칭', statuses: ['matching'] },
  { label: '견적·협의', statuses: ['quote_arrived', 'negotiating'] },
  { label: '계약', statuses: ['contracted'] },
  { label: '시공', statuses: ['in_progress'] },
  { label: '완료', statuses: ['completed'] },
]

function currentMilestoneIndex(status: QuoteRequestStatus): number {
  return MILESTONES.findIndex((m) => m.statuses.includes(status))
}

export default function StatusStepper({ status }: { status: QuoteRequestStatus }) {
  // draft(임시저장)는 아직 여정 시작 전 → 이정표 숨김
  if (status === 'draft') return null

  const current = currentMilestoneIndex(status)

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-4 font-semibold text-ink">진행 단계</h2>
      <ol className="flex items-start">
        {MILESTONES.map((m, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={m.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* 왼쪽 연결선 */}
                <div
                  className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done || active ? 'bg-brand' : 'bg-border'}`}
                />
                {/* 노드 */}
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-brand text-white'
                      : active
                        ? 'bg-brand text-white ring-4 ring-brand/20'
                        : 'bg-surface-muted text-ink-subtle ring-1 ring-border'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                {/* 오른쪽 연결선 */}
                <div
                  className={`h-0.5 flex-1 ${i === MILESTONES.length - 1 ? 'opacity-0' : done ? 'bg-brand' : 'bg-border'}`}
                />
              </div>
              <span
                className={`mt-1.5 text-center text-xs ${
                  active ? 'font-semibold text-brand' : done ? 'text-ink' : 'text-ink-subtle'
                }`}
              >
                {m.label}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
