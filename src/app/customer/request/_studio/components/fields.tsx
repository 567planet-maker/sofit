'use client'

// ============================================================
// 저수준 입력 위젯 (Phase 4)
// DynamicField 가 FieldType 에 따라 아래 위젯들을 선택해 렌더한다.
// ============================================================

import { useState } from 'react'
import type { FieldOption, DimensionValue, AddressValue } from '@/app/customer/request/schema/types'
import { m2ToPyeongRounded, pyeongToM2Rounded } from '@/lib/units'

// 공통 컨트롤 (.ctrl) — 44px, rounded-control(6px), 포커스 시 brand + 3px tint ring
export const baseInputClass =
  'h-11 w-full rounded-control border border-border bg-white px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-tint)]'

export const errorInputClass =
  'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--color-danger-tint)]'

// ─── 텍스트 / 전화 ──────────────────────────────────────────
export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  invalid?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${baseInputClass} ${invalid ? errorInputClass : ''}`}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="min-h-[88px] w-full resize-y rounded-control border border-border bg-white px-3.5 py-3 text-sm leading-[1.55] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-tint)]"
    />
  )
}

// ─── 숫자 ────────────────────────────────────────────────────
export function NumberInput({
  value,
  onChange,
  placeholder,
  unit,
  invalid,
}: {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  unit?: string
  invalid?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className={`${baseInputClass} ${invalid ? errorInputClass : ''}`}
      />
      {unit && unit !== 'm2' && (
        <span className="shrink-0 text-[13px] font-semibold text-ink-muted">{unit}</span>
      )}
    </div>
  )
}

// ─── 선택 (단일) — 커스텀 화살표 ────────────────────────────
export function Select({
  value,
  onChange,
  options,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  options: FieldOption[]
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInputClass} appearance-none pr-9 ${invalid ? errorInputClass : ''}`}
      >
        <option value="">선택하세요</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle"
      >
        <path d="M5 8l5 5 5-5" />
      </svg>
    </div>
  )
}

// ─── 다중 선택 (칩 토글) ────────────────────────────────────
export function MultiSelect({
  value,
  onChange,
  options,
  invalid,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: FieldOption[]
  invalid?: boolean
}) {
  const toggle = (v: string) =>
    value.includes(v) ? onChange(value.filter((x) => x !== v)) : onChange([...value, v])
  return (
    <div
      className={`flex flex-wrap gap-2 ${invalid ? 'rounded-control p-1 ring-1 ring-danger' : ''}`}
    >
      {options.map((o) => {
        const active = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`whitespace-nowrap rounded-pill border px-[15px] py-[9px] text-[13px] font-semibold transition-colors ${
              active
                ? 'border-brand bg-brand text-white'
                : 'border-border bg-white text-ink-muted hover:border-border-strong'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── 불리언 (예/아니오 세그먼트, 초기 미선택) ──────────────
export function Toggle({
  value,
  onChange,
}: {
  value: boolean | null | undefined
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex w-fit overflow-hidden rounded-control border border-border">
      {[
        { val: true, label: '예' },
        { val: false, label: '아니오' },
      ].map((o, i) => {
        const active = value === o.val
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.val)}
            aria-pressed={active}
            className={`h-11 whitespace-nowrap px-[19px] text-[13.5px] font-bold transition-colors ${
              i === 0 ? 'border-r border-border' : ''
            } ${active ? 'bg-brand-tint text-brand' : 'bg-white text-ink-muted'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── 치수 (mm) ──────────────────────────────────────────────
export function DimensionInput({
  value,
  onChange,
}: {
  value: DimensionValue | null
  onChange: (v: DimensionValue) => void
}) {
  const v = value ?? {}
  const set = (k: keyof DimensionValue, raw: string) =>
    onChange({ ...v, [k]: raw === '' ? null : Number(raw) })
  const cell = (k: keyof DimensionValue, label: string) => (
    <input
      type="number"
      value={v[k] ?? ''}
      onChange={(e) => set(k, e.target.value)}
      placeholder={label}
      className={`${baseInputClass} flex-1 text-center`}
    />
  )
  return (
    <div className="flex items-center gap-2.5">
      {cell('width_mm', '가로')}
      <span className="shrink-0 text-[13.5px] font-semibold text-ink-muted">×</span>
      {cell('height_mm', '세로')}
      <span className="shrink-0 text-[13px] font-semibold text-ink-muted">mm</span>
    </div>
  )
}

// ─── 주소 (도로명 + 상세) ───────────────────────────────────
export function AddressInput({
  value,
  onChange,
  invalid,
}: {
  value: AddressValue | null
  onChange: (v: AddressValue) => void
  invalid?: boolean
}) {
  const v = value ?? {}
  return (
    <div className="flex flex-col gap-2">
      <input
        value={v.road ?? ''}
        onChange={(e) => onChange({ ...v, road: e.target.value })}
        placeholder="도로명 주소"
        className={`${baseInputClass} ${invalid ? errorInputClass : ''}`}
      />
      <input
        value={v.detail ?? ''}
        onChange={(e) => onChange({ ...v, detail: e.target.value })}
        placeholder="상세 주소 (동·호수 등)"
        className={baseInputClass}
      />
    </div>
  )
}

// ─── 면적 (평 ↔ ㎡ 토글, 내부 ㎡ 저장) ─────────────────────
export function AreaInput({
  value,
  onChange,
  invalid,
}: {
  value: number | null
  onChange: (v: number | null) => void
  invalid?: boolean
}) {
  const [unit, setUnit] = useState<'pyeong' | 'm2'>('pyeong')
  const display = value == null ? '' : unit === 'm2' ? value : (m2ToPyeongRounded(value) ?? '')

  const handle = (raw: string) => {
    if (raw === '') return onChange(null)
    const n = Number(raw)
    onChange(unit === 'm2' ? n : pyeongToM2Rounded(n))
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={display}
        onChange={(e) => handle(e.target.value)}
        placeholder={unit === 'pyeong' ? '예) 10' : '예) 33'}
        className={`${baseInputClass} ${invalid ? errorInputClass : ''}`}
      />
      <div className="flex shrink-0 overflow-hidden rounded-control border border-border">
        {(['pyeong', 'm2'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
              unit === u ? 'bg-brand text-white' : 'bg-white text-ink-muted'
            }`}
          >
            {u === 'pyeong' ? '평' : '㎡'}
          </button>
        ))}
      </div>
    </div>
  )
}
