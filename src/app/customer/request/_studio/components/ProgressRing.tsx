'use client'

// ============================================================
// 원형 진행률 링 (Phase 4 리디자인)
// 필수 항목 filled/total 기준 진행률을 원형으로 표시.
// 완료(filled≥total, total>0) 시 stroke를 success 색으로.
// ============================================================

export default function ProgressRing({
  filled,
  total,
  size = 20,
  stroke = 2.4,
}: {
  filled: number
  total: number
  size?: number
  stroke?: number
}) {
  const pct = total > 0 ? Math.min(1, filled / total) : filled > 0 ? 1 : 0
  const done = total > 0 && filled >= total
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className={`transition-[stroke-dashoffset] duration-500 ${done ? 'stroke-success' : 'stroke-brand'}`}
      />
    </svg>
  )
}
