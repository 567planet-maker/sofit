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
import AttachmentManager, { type Item } from '@/components/common/AttachmentManager'
import { requiredStats } from './components/helpers'
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
  initialItemIds = {},
  initialAttachments = [],
}: {
  requestId: string
  initialCommon: Values
  initialItems: ItemMap
  initialItemIds?: Record<string, string>
  initialAttachments?: Item[]
}) {
  const router = useRouter()
  const storageKey = `quote_studio_${requestId}`

  // 전체(요청 단위, item_id NULL) 첨부만 상단 섹션으로
  const initialPhotos = useMemo(
    () => initialAttachments.filter((a) => a.item_id == null && !DOC_KINDS.has(a.kind)),
    [initialAttachments],
  )
  const initialDocs = useMemo(
    () => initialAttachments.filter((a) => a.item_id == null && DOC_KINDS.has(a.kind)),
    [initialAttachments],
  )
  // 분야별(item_id) 첨부를 item_id 기준으로 그룹핑 (사진/문서 분리는 CategorySection에서)
  const initialByItem = useMemo(() => {
    const map: Record<string, Item[]> = {}
    for (const a of initialAttachments) {
      if (a.item_id == null) continue
      ;(map[a.item_id] ??= []).push(a)
    }
    return map
  }, [initialAttachments])

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

  // 분야(category) → 서버 item id. 분야별 첨부를 붙이는 데 필요.
  const [itemIds, setItemIds] = useState<Record<string, string>>(initialItemIds)

  // 첨부 실시간 관찰: 각 AttachmentManager가 스코프 키로 최신 items를 올림.
  //   scope 키: 'req:photo' | 'req:doc' | `${cat}:photo` | `${cat}:doc`
  //   우측 요약은 이 맵을 평탄화해 실시간 미리보기로 사용.
  const [attachMap, setAttachMap] = useState<Record<string, Item[]>>({})
  function handleAttachChange(scope: string, list: Item[]) {
    setAttachMap((prev) => ({ ...prev, [scope]: list }))
  }

  // 요약용 첨부: 현재 유효한 첨부만 (제거된 분야의 잔여 스코프는 제외)
  const validItemIds = useMemo(() => new Set(Object.values(itemIds)), [itemIds])
  const summaryAttachments = useMemo(
    () =>
      Object.values(attachMap)
        .flat()
        .filter((a) => a.item_id == null || validItemIds.has(a.item_id)),
    [attachMap, validItemIds],
  )
  // item_id → category (요약에서 분야별 그룹 라벨링)
  const itemIdToCategory = useMemo(() => {
    const m: Record<string, string> = {}
    for (const [cat, id] of Object.entries(itemIds)) m[id] = cat
    return m
  }, [itemIds])

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
      // 제거 (분야 첨부는 서버에서 CASCADE + 스토리지 정리)
      const next = { ...items }
      delete next[category]
      setItems(next)
      setOrder((o) => o.filter((c) => c !== category))
      setItemIds((prev) => {
        const n = { ...prev }
        delete n[category]
        return n
      })
      setAttachMap((prev) => {
        const n = { ...prev }
        delete n[`${category}:photo`]
        delete n[`${category}:doc`]
        return n
      })
      backup(common, next)
      await removeCategoryItem(requestId, category)
    } else {
      // 추가 — 반환된 item id를 보관해야 분야별 첨부를 붙일 수 있음
      const next = { ...items, [category]: {} }
      setItems(next)
      setOrder((o) => [...o, category])
      backup(common, next)
      const res = await upsertCategoryItem(requestId, category, {})
      if (!('error' in res)) setItemIds((prev) => ({ ...prev, [category]: res.itemId }))
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
        // localStorage 복구 등으로 아직 id를 모르는 분야의 item id 확보
        setItemIds((prev) => (prev[cat] === r2.itemId ? prev : { ...prev, [cat]: r2.itemId }))
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
  const commonStat = useMemo(() => requiredStats(COMMON_FIELDS, common), [common])
  const categoryStat = useMemo(() => {
    const out: Record<string, { filled: number; total: number }> = {}
    for (const cat of order) {
      const schema = getCategorySchema(cat)
      if (schema) out[cat] = requiredStats(schema.fields, items[cat] ?? {})
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

  const activeIndex = TABS.indexOf(tab)

  return (
    <>
      {/* 모바일 탭 (슬라이딩 pill) */}
      <div className="flex-none px-5 pt-4 lg:hidden">
        <div className="relative flex rounded-card bg-surface-muted p-1">
          <span
            className="pointer-events-none absolute left-1 top-1 h-[calc(100%-8px)] rounded-[7px] bg-white shadow-card transition-transform duration-200 ease-out"
            style={{ width: 'calc(33.333% - 2.67px)', transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative z-10 flex-1 rounded-[7px] py-2.5 text-center text-[13.5px] font-bold transition-colors ${
                tab === t ? 'text-brand' : 'text-ink-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 앱 로우: 가장자리 고정 사이드 패널 + 넓은 가운데 작성 영역 */}
      <div className="flex min-h-0 flex-1 max-lg:block">
        {/* 좌: 분야 선택 */}
        <aside
          className={`${tab === '분야' ? 'block' : 'hidden'} studio-scroll shrink-0 overflow-y-auto bg-white px-[22px] py-[26px] lg:block lg:w-[288px] lg:border-r lg:border-border max-lg:overflow-visible max-lg:bg-transparent max-lg:p-5`}
        >
          {/* 페이지 제목: 별도 상단 밴드 대신 분야 컬럼 최상단으로 이동(세로 공간 절약) */}
          <div className="mb-6">
            <h1 className="text-[22px] font-bold tracking-[-.02em] text-ink">견적 요청</h1>
            <p className="mt-1.5 text-[12.5px] font-medium leading-[1.5] text-ink-muted">
              시공 분야를 선택하고 공통 정보와 분야별 내용을 작성하세요. 작성 중 내용은 임시저장됩니다.
            </p>
          </div>

          <CategorySidebar
            selected={selectedSet}
            commonStat={commonStat}
            categoryStat={categoryStat}
            onToggle={toggleCategory}
          />
        </aside>

        {/* 중: 작성 */}
        <div
          className={`${tab === '작성' ? 'block' : 'hidden'} studio-scroll min-w-0 flex-1 overflow-y-auto lg:block max-lg:overflow-visible`}
        >
          <div className="mx-auto flex max-w-[860px] flex-col gap-[22px] px-11 pb-20 pt-10 max-lg:p-5">
            {/* 견적 제목 */}
            <section className="rounded-card border border-border bg-white px-[30px] py-7 shadow-card">
              {/* 헤더: 다른 폼 섹션과 동일하게 18px 제목 + mb-[22px] */}
              <div className="mb-[22px]">
                <h2 id="quote-title-label" className="text-lg font-bold tracking-[-.01em] text-ink">
                  견적 제목
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-muted">
                  여러 견적을 구분할 수 있는 제목을 정해주세요. (예: 강남 카페 인테리어 전체)
                </p>
              </div>
              <input
                id="quote-title"
                aria-labelledby="quote-title-label"
                value={(common.title as string) ?? ''}
                onChange={(e) => handleCommonChange('title', e.target.value)}
                placeholder="견적 제목을 입력하세요"
                className="h-11 w-full rounded-control border border-border bg-white px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-tint)]"
              />
              <p className="mt-4 rounded-lg bg-brand-tint/50 px-[15px] py-[13px] text-[13px] font-semibold leading-[1.6] text-brand">
                작성 중인 내용은 자동으로 임시저장됩니다. <b>마이페이지 &gt; 내 견적 현황</b>에서
                이어서 수정할 수 있어요.
              </p>
            </section>

            <CommonInfoSection
              values={common}
              onChange={handleCommonChange}
              invalidKeys={invalidCommon}
            />

            {/* 현장 사진·도면 (요청 단위 첨부) */}
            <section
              id="section-attachments"
              className="scroll-mt-24 rounded-card border border-border bg-white px-[30px] py-7 shadow-card"
            >
              <div className="mb-[22px]">
                <h2 className="text-lg font-bold tracking-[-.01em] text-ink">
                  현장 전체 사진·도면{' '}
                  <span className="text-[13px] font-semibold text-ink-muted">(선택)</span>
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-muted">
                  현장 전반을 보여주는 공통 자료예요. 특정 분야 자료는 아래 각 분야 카드에서 따로 올릴 수 있어요.
                </p>
              </div>

              <p className="mb-5 rounded-lg bg-brand-tint/50 px-[15px] py-[13px] text-[13px] font-semibold leading-[1.6] text-brand">
                업로드한 자료는 견적 산정을 위해 협력업체에 공유됩니다. 주민번호·계좌번호 등
                개인정보는 제외해 주세요.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="mb-3">
                    <div className="text-[13.5px] font-bold text-ink">현장 사진</div>
                    <div className="mt-[3px] text-xs text-ink-muted">jpg, png · 최대 10MB</div>
                  </div>
                  <AttachmentManager
                    requestId={requestId}
                    kind="site_photo"
                    isImage
                    accept=".jpg,.jpeg,.png,.webp,.heic,image/*"
                    maxSizeMb={10}
                    label="현장 사진 추가"
                    hint="여러 장 업로드 가능"
                    initial={initialPhotos}
                    onChange={(list) => handleAttachChange('req:photo', list)}
                  />
                </div>
                <div>
                  <div className="mb-3">
                    <div className="text-[13.5px] font-bold text-ink">도면·기타 자료</div>
                    <div className="mt-[3px] text-xs text-ink-muted">pdf, dwg 등 · 최대 20MB</div>
                  </div>
                  <AttachmentManager
                    requestId={requestId}
                    kind="drawing"
                    isImage={false}
                    accept=".pdf,.jpg,.jpeg,.png,.dwg,.hwp,.zip"
                    maxSizeMb={20}
                    label="도면·기타 자료 추가"
                    initial={initialDocs}
                    onChange={(list) => handleAttachChange('req:doc', list)}
                  />
                </div>
              </div>

              <p className="mt-4 text-[12.5px] leading-[1.55] text-ink-muted">
                업로드한 파일은 견적 매칭 목적으로만 사용됩니다.
              </p>
            </section>

            {order.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                values={items[cat] ?? {}}
                onChange={(k, v) => handleItemChange(cat, k, v)}
                onRemove={() => toggleCategory(cat)}
                invalidKeys={invalidByCat[cat] ?? new Set()}
                requestId={requestId}
                itemId={itemIds[cat] ?? null}
                initialAttachments={itemIds[cat] ? (initialByItem[itemIds[cat]] ?? []) : []}
                onAttachChange={(scope, list) => handleAttachChange(`${cat}:${scope}`, list)}
              />
            ))}

            {order.length === 0 && (
              <div className="rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center">
                <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-brand-tint text-brand">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <path d="M9 9h6M9 13h6M9 17h3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-[15.5px] font-bold text-ink">아직 선택한 시공 분야가 없어요</div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-muted">
                  왼쪽에서 시공 분야를 선택하면 작성 항목이 여기에 추가됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 우: 요약 */}
        <aside
          className={`${tab === '요약' ? 'block' : 'hidden'} studio-scroll shrink-0 overflow-y-auto bg-white px-[22px] py-[26px] lg:block lg:w-[288px] lg:border-l lg:border-border max-lg:overflow-visible max-lg:bg-transparent max-lg:p-5`}
        >
          <RequestSummary
            selected={order.filter((c) => isCategoryKey(c))}
            missingCount={missingCount}
            saveStatus={saveStatus}
            submitting={submitting}
            onSave={saveAll}
            onSubmit={handleSubmit}
            submitError={submitError}
            attachments={summaryAttachments}
            itemIdToCategory={itemIdToCategory}
          />
        </aside>
      </div>
    </>
  )
}
