'use client'

// ============================================================
// 분야 1개 입력 섹션 (Phase 4) — FIELD_SCHEMAS 기반 동적 렌더
// ============================================================

import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import type { CategoryKey } from '@/app/customer/request/schema/categories'
import DynamicField from './DynamicField'
import { requiredStats, isFullWidthField } from './helpers'
import AttachmentManager, { type Item } from '@/components/common/AttachmentManager'

const DOC_KINDS = new Set(['drawing', 'prev_quote'])

export default function CategorySection({
  category,
  values,
  onChange,
  onRemove,
  invalidKeys,
  requestId,
  itemId,
  initialAttachments,
  onAttachChange,
}: {
  category: CategoryKey
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  onRemove: () => void
  invalidKeys: Set<string>
  requestId: string
  itemId: string | null
  initialAttachments: Item[]
  onAttachChange: (scope: 'photo' | 'doc', items: Item[]) => void
}) {
  const schema = getCategorySchema(category)
  if (!schema) return null

  const catPhotos = initialAttachments.filter((a) => !DOC_KINDS.has(a.kind))
  const catDocs = initialAttachments.filter((a) => DOC_KINDS.has(a.kind))

  const { filled, total } = requiredStats(schema.fields, values)

  return (
    <section
      id={`section-${category}`}
      className="scroll-mt-24 rounded-card border border-border bg-white px-[30px] py-7 shadow-card"
    >
      <div className="mb-[22px] flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[11.5px] font-bold uppercase tracking-[.04em] text-brand">
            {schema.group}
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-bold tracking-[-.01em] text-ink">{schema.label}</h2>
            <span className="whitespace-nowrap text-[12.5px] font-semibold text-ink-muted">
              ({filled}/{total} 완료)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md px-2.5 py-[7px] text-[12.5px] font-semibold text-ink-muted transition-colors hover:bg-danger-tint hover:text-danger"
        >
          분야 제거
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-[22px] gap-y-5 sm:grid-cols-2">
        {schema.fields.map((f) => (
          <div key={f.key} className={isFullWidthField(f.type) ? 'sm:col-span-2' : ''}>
            <DynamicField
              def={f}
              value={values[f.key]}
              onChange={(v) => onChange(f.key, v)}
              invalid={invalidKeys.has(f.key)}
            />
          </div>
        ))}
      </div>

      {/* 이 분야 참고 자료 (분야별 첨부) */}
      <div className="mt-[26px] border-t border-border pt-[26px]">
        <div className="mb-1 text-sm font-bold text-ink">이 분야 참고 자료 (선택)</div>
        <p className="mb-4 text-[12.5px] leading-[1.5] text-ink-muted">
          <b className="font-semibold text-ink">{schema.label}</b> 관련 사진·도면만 올려주세요. 현장 전반
          자료는 위쪽 ‘현장 전체 사진·도면’에 올리면 됩니다.
        </p>

        {itemId ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-3">
                <div className="text-[13.5px] font-bold text-ink">분야 사진</div>
                <div className="mt-[3px] text-xs text-ink-muted">jpg, png · 최대 10MB</div>
              </div>
              <AttachmentManager
                requestId={requestId}
                itemId={itemId}
                kind="site_photo"
                isImage
                accept=".jpg,.jpeg,.png,.webp,.heic,image/*"
                maxSizeMb={10}
                label="분야 사진 추가"
                hint="여러 장 업로드 가능"
                initial={catPhotos}
                onChange={(list) => onAttachChange('photo', list)}
              />
            </div>
            <div>
              <div className="mb-3">
                <div className="text-[13.5px] font-bold text-ink">분야 도면·자료</div>
                <div className="mt-[3px] text-xs text-ink-muted">pdf, dwg 등 · 최대 20MB</div>
              </div>
              <AttachmentManager
                requestId={requestId}
                itemId={itemId}
                kind="drawing"
                isImage={false}
                accept=".pdf,.jpg,.jpeg,.png,.dwg,.hwp,.zip"
                maxSizeMb={20}
                label="분야 도면·자료 추가"
                initial={catDocs}
                onChange={(list) => onAttachChange('doc', list)}
              />
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-surface-muted px-[15px] py-3 text-[12.5px] text-ink-muted">
            분야 저장 중… 잠시 후 자료를 첨부할 수 있어요.
          </p>
        )}
      </div>
    </section>
  )
}
