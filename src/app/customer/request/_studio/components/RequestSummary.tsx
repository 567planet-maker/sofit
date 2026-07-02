'use client'

// ============================================================
// 우측 실시간 요약 + 저장 상태 + 제출 (Phase 4)
// ============================================================

import { CATEGORY_LABELS, type CategoryKey } from '@/app/customer/request/schema/categories'
import SaveStatusBadge, { type SaveStatus } from './SaveStatusBadge'
import type { Item } from '@/components/common/AttachmentManager'

const DOC_KINDS = new Set(['drawing', 'prev_quote'])

export default function RequestSummary({
  selected,
  missingCount,
  saveStatus,
  submitting,
  onSave,
  onSubmit,
  submitError,
  attachments,
  itemIdToCategory,
}: {
  selected: CategoryKey[]
  missingCount: number
  saveStatus: SaveStatus
  submitting: boolean
  onSave: () => void
  onSubmit: () => void
  submitError: string | null
  attachments: Item[]
  itemIdToCategory: Record<string, string>
}) {
  // 전체(item_id NULL) / 분야별(item_id) 그룹핑
  const overall = attachments.filter((a) => a.item_id == null)
  const byCategory = new Map<string, Item[]>()
  for (const a of attachments) {
    if (a.item_id == null) continue
    const label = CATEGORY_LABELS[itemIdToCategory[a.item_id] as CategoryKey] ?? '기타 분야'
    const list = byCategory.get(label) ?? []
    list.push(a)
    byCategory.set(label, list)
  }
  const hasAttachments = attachments.length > 0
  return (
    <div>
      {submitError && (
        <p className="mb-3.5 flex gap-2 rounded-lg bg-danger-tint px-3 py-2.5 text-xs font-semibold leading-[1.5] text-danger">
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="h-12 w-full rounded-control bg-brand text-[15px] font-bold text-white transition-[background,transform] hover:bg-brand-hover active:translate-y-px disabled:opacity-60"
      >
        {submitting ? '제출 중…' : '견적 요청 제출'}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveStatus === 'saving'}
        className="mt-2.5 h-11 w-full rounded-control border border-border bg-white text-sm font-bold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
      >
        임시저장
      </button>

      <p className="mt-[18px] text-[12.5px] leading-[1.6] text-ink-muted">
        제출하면 작성 내용과 첨부한 현장 사진·도면이 견적 산정을 위해{' '}
        <b className="font-bold text-ink">소핏 협력업체(공장)</b>에게 공개됩니다.
      </p>

      <div className="mb-5 mt-[26px] flex items-center justify-between gap-2.5">
        <h3 className="text-base font-bold text-ink">요청 요약</h3>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <dl className="mb-[18px] grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-surface-muted px-[13px] py-3">
          <dt className="text-[11.5px] font-semibold text-ink-muted">선택 분야</dt>
          <dd className="mt-1 text-[22px] font-extrabold tracking-[-.01em] text-ink">
            {selected.length}개
          </dd>
        </div>
        <div className="rounded-lg bg-surface-muted px-[13px] py-3">
          <dt className="text-[11.5px] font-semibold text-ink-muted">미입력 필수</dt>
          <dd
            className={`mt-1 text-[22px] font-extrabold tracking-[-.01em] ${
              missingCount > 0 ? 'text-danger' : 'text-ink'
            }`}
          >
            {missingCount}개
          </dd>
        </div>
      </dl>

      {selected.length > 0 && (
        <ul className="mb-5 flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <li
              key={c}
              className="rounded-pill bg-brand-tint px-3 py-1.5 text-xs font-bold text-brand"
            >
              {CATEGORY_LABELS[c]}
            </li>
          ))}
        </ul>
      )}

      {hasAttachments && (
        <div className="mb-5">
          <div className="mb-2.5 text-[13px] font-bold text-ink">
            첨부 미리보기 <span className="text-ink-muted">({attachments.length})</span>
          </div>
          <div className="space-y-3">
            {overall.length > 0 && <AttachGroup title="현장 전체" items={overall} />}
            {[...byCategory.entries()].map(([label, list]) => (
              <AttachGroup key={label} title={label} items={list} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// 첨부 그룹(전체/분야) — 썸네일 그리드
function AttachGroup({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[12px] font-bold text-ink-muted">{title}</span>
        <span className="text-[11px] font-semibold text-ink-subtle">{items.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((it) => (
          <AttachThumb key={it.id} item={it} />
        ))}
      </div>
    </div>
  )
}

function AttachThumb({ item }: { item: Item }) {
  const isImage = !DOC_KINDS.has(item.kind)
  const ext = item.file_name?.split('.').pop()?.toUpperCase() ?? 'FILE'
  const caption = item.note?.trim() || item.file_name || ''
  return (
    <div
      title={caption}
      className="relative aspect-square overflow-hidden rounded-md border border-border bg-surface-muted"
    >
      {isImage && item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={caption} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-0.5 text-center text-[9px] font-bold text-ink-subtle">
          {isImage ? (item.uploading ? '…' : 'IMG') : ext}
        </div>
      )}
      {item.note?.trim() && (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white">
          {item.note.trim()}
        </span>
      )}
    </div>
  )
}
