'use client'

// ============================================================
// 스키마 1필드 → 입력 위젯 매핑 (Phase 4의 핵심)
// FieldDef.type 에 따라 위젯을 고르고, def.unknown 이 있으면
// "모름" 안전장치를 함께 렌더한다. 분야가 늘어도 이 컴포넌트는
// 수정하지 않는다 (FIELD_SCHEMAS 만 추가하면 됨).
// ============================================================

import type { FieldDef, AddressValue, DimensionValue } from '@/app/customer/request/schema/types'
import { isUnknownValue } from '@/app/customer/request/schema/types'
import UnknownToggle from './UnknownToggle'
import {
  TextInput,
  TextArea,
  NumberInput,
  Select,
  MultiSelect,
  Toggle,
  DimensionInput,
  AddressInput,
  AreaInput,
} from './fields'

export default function DynamicField({
  def,
  value,
  onChange,
  invalid,
}: {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  invalid?: boolean
}) {
  const isUnknown = isUnknownValue(value)

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {def.label}
        {def.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {def.help && <p className="mb-1.5 text-xs text-ink-subtle">{def.help}</p>}

      {!isUnknown && renderWidget(def, value, onChange, invalid)}

      {def.unknown && (
        <UnknownToggle
          mode={def.unknown}
          active={isUnknown}
          onToggle={(on) =>
            onChange(on ? { __unknown: true, reason: def.unknown } : null)
          }
        />
      )}
    </div>
  )
}

function renderWidget(
  def: FieldDef,
  value: unknown,
  onChange: (v: unknown) => void,
  invalid?: boolean,
) {
  switch (def.type) {
    case 'text':
      return (
        <TextInput
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={def.placeholder}
          invalid={invalid}
        />
      )
    case 'tel':
      return (
        <TextInput
          type="tel"
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={def.placeholder}
          invalid={invalid}
        />
      )
    case 'textarea':
      return (
        <TextArea
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={def.placeholder}
        />
      )
    case 'number':
      return (
        <NumberInput
          value={(value as number) ?? null}
          onChange={onChange}
          placeholder={def.placeholder}
          unit={def.unit}
          invalid={invalid}
        />
      )
    case 'date':
      return (
        <TextInput type="date" value={(value as string) ?? ''} onChange={onChange} invalid={invalid} />
      )
    case 'select':
      return (
        <Select
          value={(value as string) ?? ''}
          onChange={onChange}
          options={def.options ?? []}
          invalid={invalid}
        />
      )
    case 'multiselect':
      return (
        <MultiSelect
          value={(value as string[]) ?? []}
          onChange={onChange}
          options={def.options ?? []}
          invalid={invalid}
        />
      )
    case 'boolean':
      return <Toggle value={!!value} onChange={onChange} />
    case 'dimension':
      return (
        <DimensionInput value={(value as DimensionValue) ?? null} onChange={onChange} />
      )
    case 'address':
      return (
        <AddressInput value={(value as AddressValue) ?? null} onChange={onChange} invalid={invalid} />
      )
    case 'area':
      return <AreaInput value={(value as number) ?? null} onChange={onChange} invalid={invalid} />
    default:
      return null
  }
}
