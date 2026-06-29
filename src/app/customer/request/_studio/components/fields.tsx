'use client'

// ============================================================
// 저수준 입력 위젯 (Phase 4)
// DynamicField 가 FieldType 에 따라 아래 위젯들을 선택해 렌더한다.
// ============================================================

import { useState } from 'react'
import type { FieldOption, DimensionValue, AddressValue } from '@/app/customer/request/schema/types'
import { m2ToPyeongRounded, pyeongToM2Rounded } from '@/lib/units'

export const baseInputClass =
  'w-full rounded-card border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20'

export const errorInputClass = 'border-red-400 focus:border-red-400 focus:ring-red-200'

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
      className={`${baseInputClass} resize-y`}
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
      {unit && unit !== 'm2' && <span className="shrink-0 text-sm text-ink-subtle">{unit}</span>}
    </div>
  )
}

// ─── 선택 (단일) ────────────────────────────────────────────
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInputClass} ${invalid ? errorInputClass : ''}`}
    >
      <option value="">선택하세요</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
    <div className={`flex flex-wrap gap-2 ${invalid ? 'rounded-card p-1 ring-1 ring-red-300' : ''}`}>
      {options.map((o) => {
        const active = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active
                ? 'border-brand bg-brand text-white'
                : 'border-border bg-surface text-ink-muted hover:border-brand-tint-strong'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── 불리언 (예/아니오 토글) ────────────────────────────────
export function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`inline-flex h-7 w-12 items-center rounded-full px-0.5 transition-colors ${
        value ? 'bg-brand' : 'bg-border-strong'
      }`}
      aria-pressed={value}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
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
    <div className="flex-1">
      <input
        type="number"
        value={v[k] ?? ''}
        onChange={(e) => set(k, e.target.value)}
        placeholder={label}
        className={baseInputClass}
      />
    </div>
  )
  return (
    <div className="flex items-center gap-2">
      {cell('width_mm', '가로')}
      <span className="text-ink-subtle">×</span>
      {cell('height_mm', '세로')}
      <span className="shrink-0 text-sm text-ink-subtle">mm</span>
    </div>
  )
}

// ─── 주소 ────────────────────────────────────────────────────
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
    <div className="space-y-2">
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
      <div className="flex shrink-0 overflow-hidden rounded-control border border-border text-sm">
        {(['pyeong', 'm2'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnit(u)}
            className={`px-3 py-2 transition-colors ${
              unit === u ? 'bg-brand text-white' : 'bg-surface text-ink-muted'
            }`}
          >
            {u === 'pyeong' ? '평' : '㎡'}
          </button>
        ))}
      </div>
    </div>
  )
}
