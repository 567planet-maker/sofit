'use client'

// ============================================================
// 공통 정보 입력 섹션 (Phase 4) — COMMON_SCHEMA 기반
// ============================================================

import { COMMON_SCHEMA } from '@/app/customer/request/schema/commonSchema'
import DynamicField from './DynamicField'

export default function CommonInfoSection({
  values,
  onChange,
  invalidKeys,
}: {
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  invalidKeys: Set<string>
}) {
  return (
    <section id="section-common" className="scroll-mt-24 rounded-card bg-white p-6 shadow-card ring-1 ring-border">
      <h2 className="mb-1 text-lg font-semibold text-ink">공통 정보</h2>
      <p className="mb-5 text-sm text-ink-muted">현장·일정·예산 등 모든 견적에 공통으로 필요한 정보입니다.</p>

      <div className="space-y-6">
        {COMMON_SCHEMA.map((sec) => (
          <div key={sec.id}>
            <h3 className="mb-3 text-sm font-medium text-ink-muted">
              {sec.label}
              {sec.required && <span className="ml-1 text-xs text-red-500">필수</span>}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {sec.fields.map((f) => (
                <div key={f.key} className={f.type === 'textarea' || f.type === 'address' ? 'sm:col-span-2' : ''}>
                  <DynamicField
                    def={f}
                    value={values[f.key]}
                    onChange={(v) => onChange(f.key, v)}
                    invalid={invalidKeys.has(f.key)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
