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
    // 그리드 셀은 행의 가장 높은 필드에 맞춰 늘어난다(items-stretch).
    // 위젯 블록을 mt-auto로 셀 하단에 고정 → help 유무와 무관하게 위젯 라인이 정렬됨.
    <div className="flex h-full min-w-0 flex-col">
      {/* 라벨 행: 라벨(13.5/600) + 필수 별표, 우측에 "모름" pill 통합(space-between).
          pill 높이(≈30px)로 행 높이를 고정 → pill 유무와 무관하게 모든 필드의
          라벨 라인이 같은 높이가 되어 좌·우 열 정렬이 딱 맞는다. */}
      <div className="flex min-h-[30px] items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[13.5px] font-semibold text-ink">
          {def.label}
          {def.required && <span className="text-danger">*</span>}
        </span>
        {def.unknown && (
          <UnknownToggle
            mode={def.unknown}
            active={isUnknown}
            onToggle={(on) => onChange(on ? { __unknown: true, reason: def.unknown } : null)}
          />
        )}
      </div>

      {/* 도움말: 라벨 바로 아래 살짝 붙여 한 그룹처럼(12.5px) */}
      {def.help && (
        <p className="mt-0.5 text-[12.5px] leading-[1.4] text-ink-muted">{def.help}</p>
      )}

      {/* 위젯: 요소 간 7px(pt-[7px]) + mt-auto로 셀 하단 고정 →
          help 유무·행 높이차와 무관하게 위젯 라인이 정렬됨.
          "모름" 활성 시 흐림 + 비활성(값은 UnknownValue로 대체됨) */}
      <div className="mt-auto pt-[7px]">
        <div className={isUnknown ? 'pointer-events-none opacity-40' : ''}>
          {renderWidget(def, isUnknown ? undefined : value, isUnknown ? () => {} : onChange, invalid)}
        </div>
        {invalid && (
          <span className="mt-[7px] block text-[11.5px] font-semibold text-danger">
            필수 항목입니다.
          </span>
        )}
      </div>
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
      return <Toggle value={value as boolean | null | undefined} onChange={onChange} />
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
