'use client'

// ============================================================
// 견적 요청 스튜디오 (Phase 4) — 3분할 동적 폼 오케스트레이터
//   좌: 분야 선택 / 중: 공통 + 분야별 작성 / 우: 요약·제출
// 임시저장: localStorage 즉시 백업 + 분야 토글·명시 저장·제출 시 서버 upsert.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMMON_FIELDS } from '@/app/customer/request/schema/commonSchema'
import { getCategorySchema } from '@/app/customer/request/schema/fieldSchemas'
import {
  ALL_CATEGORIES,
  isCategoryKey,
  type CategoryKey,
} from '@/app/customer/request/schema/categories'
import {
  saveCommonInfo,
  upsertCategoryItem,
  removeCategoryItem,
  submitQuoteDraft,
} from '@/app/actions/quote-request'
import CategorySidebar from './components/CategorySidebar'
import CommonInfoSection from './components/CommonInfoSection'
import CategorySection from './components/CategorySection'
import RequestSummary from './components/RequestSummary'
import AttachmentManager from '@/components/common/AttachmentManager'
import type { AttachmentRow } from '@/app/actions/quote-request'
import { progressPercent, requiredStats } from './components/helpers'
import type { SaveStatus } from './components/SaveStatusBadge'

type Values = Record<string, unknown>
type ItemMap = Record<string, Values>

const DOC_KINDS = new Set(['drawing', 'prev_quote'])

const TABS = ['분야', '작성', '요약'] as const
type Tab = (typeof TABS)[number]

export default function QuoteRequestStudio({
  requestId,
  initialCommon,
  initialItems,
  initialAttachments = [],
}: {
  requestId: string
  initialCommon: Values
  initialItems: ItemMap
  initialAttachments?: AttachmentRow[]
}) {
  const router = useRouter()
  const storageKey = `quote_studio_${requestId}`

  const initialPhotos = useMemo(
    () => initialAttachments.filter((a) => !DOC_KINDS.has(a.kind)),
    [initialAttachments],
  )
  const initialDocs = useMemo(
    () => initialAttachments.filter((a) => DOC_KINDS.has(a.kind)),
    [initialAttachments],
  )

  const [common, setCommon] = useState<Values>(initialCommon)
  const [items, setItems] = useState<ItemMap>(initialItems)
  const [order, setOrder] = useState<CategoryKey[]>(
    ALL_CATEGORIES.map((c) => c.key).filter((k) => k in initialItems),
  )

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [invalidCommon, setInvalidCommon] = useState<Set<string>>(new Set())
  const [invalidByCat, setInvalidByCat] = useState<Record<string, Set<string>>>({})
  const [tab, setTab] = useState<Tab>('작성')

  // 하이브리드 자동저장: localStorage 즉시 백업 + 편집 1.5초 후 서버 upsert
  const autosaveTimer = useRef<number | null>(null)
  const skipAutosave = useRef(true) // 마운트·하이드레이션 시점엔 저장 안 함(첫 사용자 편집부터)

  // localStorage 복구 (서버 초기값 위에 미저장 편집 덮어쓰기)
  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as { common?: Values; items?: ItemMap }
        // 마운트 1회 localStorage 하이드레이션(ref로 가드). SSR 값 위에 미저장 편집 복원.
        /* eslint-disable react-hooks/set-state-in-effect */
        if (parsed.common) setCommon(parsed.common)
        if (parsed.items) {
          setItems(parsed.items)
          setOrder(ALL_CATEGORIES.map((c) => c.key).filter((k) => k in parsed.items!))
        }
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // 무시
    }
  }, [storageKey])

  // 편집 1.5초 후 서버 자동저장 (디바운스). 첫 사용자 편집 전엔 skip.
  useEffect(() => {
    if (skipAutosave.current) return
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(() => {
      void saveAll()
    }, 1500)
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    }
    // saveAll 은 매 렌더 새로 생성되므로 deps 제외 — common/items 편집 시에만 디바운스
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [common, items])

  // localStorage 즉시 백업
  function backup(nextCommon: Values, nextItems: ItemMap) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ common: nextCommon, items: nextItems }))
    } catch {
      // 무시
    }
  }

  function handleCommonChange(key: string, value: unknown) {
    setCommon((prev) => {
      const next = { ...prev, [key]: value }
      backup(next, items)
      return next
    })
    skipAutosave.current = false
    setSaveStatus('idle')
    if (invalidCommon.has(key)) {
      setInvalidCommon((prev) => {
        const n = new Set(prev)
        n.delete(key)
        return n
      })
    }
  }

  function handleItemChange(category: CategoryKey, key: string, value: unknown) {
    setItems((prev) => {
      const next = { ...prev, [category]: { ...prev[category], [key]: value } }
      backup(common, next)
      return next
    })
    skipAutosave.current = false
    setSaveStatus('idle')
    if (invalidByCat[category]?.has(key)) {
      setInvalidByCat((prev) => {
        const n = new Set(prev[category])
        n.delete(key)
        return { ...prev, [category]: n }
      })
    }
  }

  async function toggleCategory(category: CategoryKey) {
    if (category in items) {
      // 제거
      const next = { ...items }
      delete next[category]
      setItems(next)
      setOrder((o) => o.filter((c) => c !== category))
      backup(common, next)
      await removeCategoryItem(requestId, category)
    } else {
      // 추가
      const next = { ...items, [category]: {} }
      setItems(next)
      setOrder((o) => [...o, category])
      backup(common, next)
      await upsertCategoryItem(requestId, category, {})
    }
  }

  // 공통 값 정리: 빈 문자열 → null (date/numeric 컬럼 보호)
  function cleanCommon(src: Values): Values {
    const out: Values = {}
    for (const [k, v] of Object.entries(src)) out[k] = v === '' ? null : v
    return out
  }

  async function saveAll(): Promise<boolean> {
    setSaveStatus('saving')
    try {
      const r1 = await saveCommonInfo(requestId, cleanCommon(common))
      if ('error' in r1) throw new Error(r1.error)
      for (const cat of order) {
        const r2 = await upsertCategoryItem(requestId, cat, items[cat] ?? {})
        if ('error' in r2) throw new Error(r2.error)
      }
      setSaveStatus('saved')
      return true
    } catch {
      setSaveStatus('error')
      return false
    }
  }

  async function handleSubmit() {
    // 제출 중에는 자동저장이 끼어들지 않도록 디바운스 타이머 정리
    skipAutosave.current = true
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    setSubmitError(null)
    setSubmitting(true)
    try {
      const ok = await saveAll()
      if (!ok) {
        setSubmitError('저장에 실패했습니다. 다시 시도해주세요.')
        return
      }
      const res = await submitQuoteDraft(requestId)
      if ('error' in res) {
        setSubmitError(res.error)
        return
      }
      if (res.ok === false) {
        // 검증 실패 → 미입력 필드 하이라이트
        const commonSet = new Set<string>()
        const catMap: Record<string, Set<string>> = {}
        for (const e of res.errors) {
          if (e.scope === 'common') commonSet.add(e.key)
          else {
            catMap[e.scope] = catMap[e.scope] ?? new Set()
            catMap[e.scope].add(e.key)
          }
        }
        setInvalidCommon(commonSet)
        setInvalidByCat(catMap)
        setTab('작성')
        setSubmitError('필수 항목을 모두 입력해주세요.')
        // 첫 미입력 항목이 있는 섹션으로만 스크롤
        const first = res.errors[0]
        const sectionId = first.scope === 'common' ? 'section-common' : `section-${first.scope}`
        requestAnimationFrame(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        return
      }
      // 성공
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // 무시
      }
      router.push(`/customer/request/submitted?id=${requestId}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── 파생 값 ──
  const selectedSet = useMemo(() => new Set(order), [order])
  const commonPercent = progressPercent(COMMON_FIELDS, common)
  const categoryPercent = useMemo(() => {
    const out: Record<string, number> = {}
    for (const cat of order) {
      const schema = getCategorySchema(cat)
      if (schema) out[cat] = progressPercent(schema.fields, items[cat] ?? {})
    }
    return out
  }, [order, items])

  const missingCount = useMemo(() => {
    let n = 0
    const c = requiredStats(COMMON_FIELDS, common)
    n += c.total - c.filled
    for (const cat of order) {
      const schema = getCategorySchema(cat)
      if (!schema) continue
      const s = requiredStats(schema.fields, items[cat] ?? {})
      n += s.total - s.filled
    }
    return n
  }, [common, items, order])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 모바일 탭 */}
      <div className="mb-4 flex gap-1 rounded-card bg-surface-muted p-1 lg:hidden">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-control py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-brand shadow-sm' : 'text-ink-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr_300px]">
        {/* 좌: 분야 선택 */}
        <aside className={`${tab === '분야' ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-20">
            <CategorySidebar
              selected={selectedSet}
              commonPercent={commonPercent}
              categoryPercent={categoryPercent}
              onToggle={toggleCategory}
            />
          </div>
        </aside>

        {/* 중: 작성 */}
        <div className={`${tab === '작성' ? 'block' : 'hidden'} space-y-6 lg:block`}>
          {/* 견적 제목 */}
          <section className="rounded-card bg-white p-6 shadow-card ring-1 ring-border">
            <label className="mb-1 block text-sm font-medium text-ink">견적 제목</label>
            <p className="mb-2 text-xs text-ink-subtle">
              여러 견적을 구분할 수 있는 제목을 정해주세요. (예: 강남 카페 인테리어 전체)
            </p>
            <input
              value={(common.title as string) ?? ''}
              onChange={(e) => handleCommonChange('title', e.target.value)}
              placeholder="견적 제목을 입력하세요"
              className="w-full rounded-card border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-3 flex items-start gap-2 rounded-card bg-brand-tint/50 px-3 py-2.5">
              <span className="text-base leading-none">💾</span>
              <p className="text-xs text-brand">
                작성 중인 내용은 자동으로 임시저장됩니다. 지금 끝내지 못해도{' '}
                <b>마이페이지 &gt; 내 견적 현황</b>에서 이어서 수정할 수 있어요.
              </p>
            </div>
          </section>

          <CommonInfoSection
            values={common}
            onChange={handleCommonChange}
            invalidKeys={invalidCommon}
          />

          {/* 현장 사진·도면 (요청 단위 첨부) */}
          <section
            id="section-attachments"
            className="rounded-card bg-white p-6 shadow-card ring-1 ring-border"
          >
            <h2 className="text-base font-semibold text-ink">현장 사진·도면 (선택)</h2>
            <p className="mt-1 text-sm text-ink-muted">
              현장 사진과 도면을 첨부하면 공장이 더 정확한 견적을 보낼 수 있어요.
            </p>
            <p className="mb-4 mt-2 flex items-start gap-1.5 rounded-lg bg-warning-tint px-3 py-2 text-xs leading-relaxed text-warning">
              <span>📢</span>
              <span>
                업로드한 사진·도면은 견적 산정을 위해 <b>소핏 협력업체(공장)</b>에게 공개됩니다.
                개인정보(주민번호·계좌 등)가 담긴 자료는 올리지 마세요.
              </span>
            </p>
            <div className="space-y-5">
              <AttachmentManager
                requestId={requestId}
                kind="site_photo"
                isImage
                accept=".jpg,.jpeg,.png,.webp,.heic,image/*"
                maxSizeMb={10}
                label="현장 사진 추가"
                hint="여러 장 업로드 가능"
                initial={initialPhotos}
              />
              <AttachmentManager
                requestId={requestId}
                kind="drawing"
                isImage={false}
                accept=".pdf,.jpg,.jpeg,.png,.dwg,.hwp,.zip"
                maxSizeMb={20}
                label="도면·기타 자료 추가"
                initial={initialDocs}
              />
            </div>
          </section>

          {order.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              values={items[cat] ?? {}}
              onChange={(k, v) => handleItemChange(cat, k, v)}
              onRemove={() => toggleCategory(cat)}
              invalidKeys={invalidByCat[cat] ?? new Set()}
            />
          ))}
          {order.length === 0 && (
            <div className="rounded-card border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-ink-muted">
              왼쪽에서 시공 분야를 선택하면 작성 항목이 추가됩니다.
            </div>
          )}
        </div>

        {/* 우: 요약 */}
        <aside className={`${tab === '요약' ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-20">
            <RequestSummary
              selected={order.filter((c) => isCategoryKey(c))}
              missingCount={missingCount}
              saveStatus={saveStatus}
              submitting={submitting}
              onSave={saveAll}
              onSubmit={handleSubmit}
              submitError={submitError}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
