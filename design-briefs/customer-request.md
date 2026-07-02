# 견적 요청 작성(스튜디오) 리디자인 브리프 (소핏 / SOFIT)

> 이 문서 하나만 클로드에게 넘기면 됩니다. 아래 코드/토큰/제약을 그대로 복붙하세요.

---

## 0. 요청 (프롬프트로 사용)

소핏(SOFIT) **견적 요청 작성 화면(견적 스튜디오)**을 리디자인해줘.

- 스택: **Next.js (App Router) + React + Tailwind CSS v4**. 편집 화면 본체(`QuoteRequestStudio` 및 하위 섹션들)는 `'use client'` 컴포넌트다. 페이지 셸(`[id]/page.tsx`)은 `async` 서버 컴포넌트다.
- **디자인 토큰만 사용**할 것. 임의 hex 색 금지, 아래 토큰 클래스(`bg-brand`, `text-ink`, `rounded-card`, `ring-border` 등)만 사용.
- 방향(톤): **현재 톤 유지·개선**. Stripe식 절제된 카드(흰 카드 + `ring-1 ring-border` + `shadow-card`)와 브랜드 블루(#0064FF)를 유지하되, 3분할 레이아웃의 위계·여백·진행감(progress)·저장 상태 피드백·모바일 탭 경험의 완성도를 높여라. 레이아웃 골격(좌 분야 / 중 작성 / 우 요약)은 유지.
- 아래 **"바꾸면 안 되는 것"의 기능 구조(스키마 기반 동적 필드, 자동저장, 서버 액션, 제출 검증, 라우팅/RLS)를 그대로 보존**할 것. 마크업/클래스/구성만 바꿔라.
- 결과물: 최소 `src/app/customer/request/_studio/QuoteRequestStudio.tsx` + 하위 섹션 컴포넌트들의 리디자인 코드, 그리고 페이지 헤더 셸(`[id]/page.tsx`의 상단 헤더 블록).

---

## 1. 디자인 토큰 (globals.css `@theme` — 이것만 사용)

```css
/* Brand */
--color-brand: #0064FF;  --color-brand-hover: #004FCC;  --color-brand-active: #003D99;
--color-brand-tint: #E8F1FF;  --color-brand-tint-strong: #C9DEFF;
/* Neutral */
--color-ink: #1A1F36;  --color-ink-muted: #4F566B;  --color-ink-subtle: #8792A2;
--color-canvas: #F6F8FB;  --color-surface: #FFFFFF;  --color-surface-muted: #F0F3F8;
--color-border: #E3E8EE;  --color-border-strong: #D5DBE3;
/* Semantic */
--color-success: #1A7F64;  --color-success-tint: #E6F4EF;
--color-warning: #9A6700;  --color-warning-tint: #FBF3E0;
--color-danger: #E5484D;   --color-danger-tint: #FDECEC;
/* Radius */  --radius-card: 10px (rounded-card);  --radius-control: 6px (rounded-control);  --radius-pill (rounded-pill)
/* Shadow */  --shadow-card;  --shadow-card-hover;  --shadow-pop
```
- Tailwind v4 유틸리티로 바로 사용: `bg-brand`, `text-ink-muted`, `border-border`, `ring-border`, `rounded-card`, `shadow-card`, `bg-warning-tint`, `text-warning`, `bg-danger-tint` 등.
- 폰트: **Pretendard** (전역 적용, 지정 불필요).
- 참고: 현재 코드엔 `text-red-500`(공통정보 "필수" 뱃지, DynamicField `*` 마크)가 남아 있음 → 리디자인 시 **`text-danger` 토큰으로 정리** 권장.

---

## 2. 현재 화면 구조 & 코드 (기준점)

### 라우팅 현실 (중요)
- `/customer/request` → `redirect('/customer/request/new')` (구 URL 호환용 리다이렉트뿐).
- `/customer/request/new` → 로그인·역할 확인 후 **빈 draft 생성** → `redirect('/customer/request/{id}')`.
- **실제 편집 화면 = `/customer/request/[id]`** → 페이지 셸이 `QuoteRequestStudio`를 렌더.
- 리디자인 대상 파일:
  - `src/app/customer/request/[id]/page.tsx` (서버 셸 — 상단 헤더 블록)
  - `src/app/customer/request/_studio/QuoteRequestStudio.tsx` (3분할 오케스트레이터)
  - `src/app/customer/request/_studio/components/*` (CategorySidebar / CommonInfoSection / CategorySection / RequestSummary / DynamicField / SaveStatusBadge / AttachmentManager)

### 레이아웃 요약
- 페이지 최상단: 흰 배경 헤더 바(`border-b`), `max-w-7xl`, 제목 "견적 요청" + 안내문. 배경은 `bg-surface-muted`.
- 본문: `max-w-7xl`, 데스크톱 **3열 그리드** `lg:grid-cols-[260px_1fr_300px]`, 열 간격 `gap-6`.
  - **좌(260px)**: 분야 선택 사이드바 (`lg:sticky lg:top-20`).
  - **중(1fr)**: 작성 영역 — 견적 제목 카드 → 공통 정보 → 현장 사진·도면 → 선택한 분야별 섹션들.
  - **우(300px)**: 실시간 요약 + 저장상태 + 제출 (`lg:sticky lg:top-20`).
- 모바일(`< lg`): 상단 **탭 스위처**(`분야` / `작성` / `요약`)로 3영역 중 하나만 표시. 기본 탭 `작성`.
- 카드 공통 스타일: `rounded-card bg-white p-6 shadow-card ring-1 ring-border`.

### `src/app/customer/request/[id]/page.tsx` — 헤더 셸 (서버 컴포넌트, 발췌)
```tsx
return (
  <div className="min-h-screen bg-surface-muted">
    <div className="border-b border-border bg-white px-4 py-5">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-ink">견적 요청</h1>
        <p className="mt-1 text-sm text-ink-muted">
          시공 분야를 선택하고 공통 정보와 분야별 내용을 작성하세요. 작성 중 내용은 임시저장됩니다.
        </p>
      </div>
    </div>
    <QuoteRequestStudio
      requestId={id}
      initialCommon={initialCommon}
      initialItems={initialItems}
      initialAttachments={initialAttachments}
    />
  </div>
)
```

### `QuoteRequestStudio.tsx` — 3분할 오케스트레이터 (클라이언트, 렌더부 발췌)
> 상태/자동저장/제출 로직은 그대로 유지(§3). 아래는 **마크업 레이아웃만** 발췌.
```tsx
return (
  <div className="mx-auto max-w-7xl px-4 py-6">
    {/* 모바일 탭 */}
    <div className="mb-4 flex gap-1 rounded-card bg-surface-muted p-1 lg:hidden">
      {TABS.map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)}
          className={`flex-1 rounded-control py-2 text-sm font-medium transition-colors ${
            tab === t ? 'bg-white text-brand shadow-sm' : 'text-ink-muted'}`}>
          {t}
        </button>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-[260px_1fr_300px]">
      {/* 좌: 분야 선택 */}
      <aside className={`${tab === '분야' ? 'block' : 'hidden'} lg:block`}>
        <div className="lg:sticky lg:top-20">
          <CategorySidebar selected={selectedSet} commonPercent={commonPercent}
            categoryPercent={categoryPercent} onToggle={toggleCategory} />
        </div>
      </aside>

      {/* 중: 작성 */}
      <div className={`${tab === '작성' ? 'block' : 'hidden'} space-y-6 lg:block`}>
        {/* 견적 제목 카드 */}
        <section className="rounded-card bg-white p-6 shadow-card ring-1 ring-border">
          <label className="mb-1 block text-sm font-medium text-ink">견적 제목</label>
          <p className="mb-2 text-xs text-ink-subtle">여러 견적을 구분할 수 있는 제목을 정해주세요. (예: 강남 카페 인테리어 전체)</p>
          <input value={(common.title as string) ?? ''} onChange={(e) => handleCommonChange('title', e.target.value)}
            placeholder="견적 제목을 입력하세요"
            className="w-full rounded-card border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20" />
          {/* 💾 자동 임시저장 안내 (bg-brand-tint/50, text-brand) */}
        </section>

        <CommonInfoSection values={common} onChange={handleCommonChange} invalidKeys={invalidCommon} />

        {/* 현장 사진·도면 (요청 단위 첨부) — 경고 배너(bg-warning-tint) + AttachmentManager 2개(site_photo / drawing) */}
        <section id="section-attachments" className="rounded-card bg-white p-6 shadow-card ring-1 ring-border"> ... </section>

        {order.map((cat) => (
          <CategorySection key={cat} category={cat} values={items[cat] ?? {}}
            onChange={(k, v) => handleItemChange(cat, k, v)} onRemove={() => toggleCategory(cat)}
            invalidKeys={invalidByCat[cat] ?? new Set()} />
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
          <RequestSummary selected={...} missingCount={missingCount} saveStatus={saveStatus}
            submitting={submitting} onSave={saveAll} onSubmit={handleSubmit} submitError={submitError} />
        </div>
      </aside>
    </div>
  </div>
)
```

### 하위 컴포넌트 요약 (인터페이스 + 현재 UI)

- **`CategorySidebar`** — props: `{ selected: Set<CategoryKey>, commonPercent, categoryPercent, onToggle }`.
  상단에 "공통 정보" 고정 카드(`border-brand-tint-strong bg-brand-tint/40`, 진행률 dot). 그 아래 `CATEGORY_GROUPS`를 그룹 헤더 + 체크박스 리스트로 렌더. 스키마 준비 안 된 분야는 `disabled` + "준비 중" 라벨. 진행률은 `ProgressDot`(100%면 `✓ text-success`, 아니면 `{n}%`).
- **`CommonInfoSection`** — props: `{ values, onChange, invalidKeys }`. 카드(`id="section-common"`, `scroll-mt-24`). `COMMON_SCHEMA` 섹션들을 순회, 섹션 라벨(+필수 뱃지) + `sm:grid-cols-2` 그리드에 `DynamicField` 렌더. textarea/address는 `sm:col-span-2`.
- **`CategorySection`** — props: `{ category, values, onChange, onRemove, invalidKeys }`. 카드(`id="section-{category}"`). 상단에 그룹(작은 brand 라벨)+분야명 + 우측 "분야 제거" 버튼(hover 시 `text-danger`). `sm:grid-cols-2` 동적 필드.
- **`DynamicField`** — 스키마 1필드 → 위젯 매핑. 라벨(+필수 `*`) + `help` 텍스트 + 위젯. `def.unknown` 있으면 "모름" 토글(`UnknownToggle`) 함께 렌더. 위젯 종류: text/tel/textarea/number(단위)/date/select/multiselect/boolean(Toggle)/dimension/address/area. **이 매핑 구조·위젯 목록은 유지**(분야 추가 시 이 파일 안 고치는 설계).
- **`RequestSummary`** — props: `{ selected, missingCount, saveStatus, submitting, onSave, onSubmit, submitError }`. 카드에 "요청 요약" + `SaveStatusBadge`, 선택 분야 수/미입력 필수 수(`dl`), 선택 분야 pill 목록(`rounded-full bg-brand-tint text-brand`), 제출 에러(`bg-danger-tint`), 공개 안내(📢), **제출 버튼(brand)** + **임시저장 버튼(outline)**.
- **`SaveStatusBadge`** — `SaveStatus = 'idle'|'saving'|'saved'|'error'` 뱃지.
- **`AttachmentManager`**(`@/components/common/AttachmentManager`) — 공용 업로더. props(현재 사용): `{ requestId, kind, isImage, accept, maxSizeMb, label, hint?, initial }`. **시그니처·업로드 동작 유지**, 시각만 손봐도 됨.

---

## 3. 바꾸면 안 되는 것 (기능 — 반드시 보존)

| 요소 | 이유 |
|---|---|
| 라우팅 체인: `/request` → `/request/new`(draft 생성) → `/request/[id]` | 진입 흐름. redirect·draft 생성 로직 유지. |
| `[id]/page.tsx`의 인증/역할/소유권 가드 + `status !== 'draft'`면 읽기전용 상세로 redirect | 접근제어(RLS 기반). 그대로. |
| 스키마 기반 동적 렌더 (`COMMON_SCHEMA`, `getCategorySchema`, `ALL_CATEGORIES`/`CATEGORY_GROUPS`) | 분야가 늘어도 컴포넌트 수정 없이 동작하는 설계. 하드코딩 필드로 바꾸지 말 것. |
| 하이브리드 자동저장: `localStorage` 즉시 백업 + 1.5초 디바운스 서버 upsert(`saveCommonInfo`/`upsertCategoryItem`) | 임시저장 UX. 타이머·`skipAutosave`/`hydrated` ref 로직 유지. |
| 분야 토글 시 `upsertCategoryItem`/`removeCategoryItem` 즉시 호출 | 서버 동기화. |
| 제출 `handleSubmit`: saveAll → `submitQuoteDraft` → 검증 실패 시 `invalidCommon`/`invalidByCat` 하이라이트 + 해당 섹션으로 스크롤(`section-common`/`section-{cat}`) + `작성` 탭 전환 | 제출 검증 UX. `id`/`scroll-mt-24` 앵커 유지. |
| 제출 성공 시 `localStorage.removeItem` 후 `/customer/request/submitted?id=...` 이동 | 완료 흐름. |
| 서버 액션 임포트(`@/app/actions/quote-request`)와 호출 시그니처 | 백엔드 계약. |
| "모름" 토글(`UnknownToggle`) 및 `{ __unknown: true, reason }` 값 형태 | 데이터 계약. |
| 첨부 경고 배너 문구(공장 공개 고지) + 개인정보 주의 문구 | 법적·프라이버시 고지. |
| 필수 표시(`*` / "필수")·미입력 카운트·진행률(%) 개념 | 작성 완성도 피드백. |

---

## 4. 개선해도 되는 것 (자유)
- 3열의 시각 위계·여백·구분(특히 좌 사이드바 진행률, 우 요약의 제출 CTA 강조).
- 진행률 표현(dot/%/막대/링 등), 저장 상태 뱃지의 마이크로 인터랙션.
- 카드 헤더·섹션 타이포 스케일, 분야 pill·체크박스 리스트의 완성도, "분야 제거" 어포던스.
- 모바일 탭 스위처(로그인 리디자인의 슬라이딩 pill 톤과 통일하면 좋음), sticky 사이드 동작.
- 빈 상태(분야 미선택) 안내, 첨부 영역·안내 배너의 시각 정리.
- `text-red-500` → `text-danger` 등 토큰 일관성 정리.
- 안내/고지 문구는 **의미 유지 선에서** 다듬기 가능(삭제는 금지 — §3).

---

## 5. 넘기지 않아도 되는 것
- 전체 코드베이스 / node_modules / 환경변수·시크릿 / Supabase 키
- `@/app/actions/quote-request` 내부 구현(시그니처만)
- 스키마 정의 파일 내부값(`commonSchema`/`fieldSchemas`/`categories`) — **구조만** 알면 됨(동적 렌더라 필드 목록을 직접 넣을 필요 없음)
- 개별 위젯(`fields.tsx`)의 전체 소스 — 위젯 종류 목록(§2 DynamicField)만으로 충분

> 참고: 이 화면은 **로그인 필요 + draft 생성 부작용**이 있어 비로그인 헤드리스로는 캡처가 안 됩니다. 시각 참고가 필요하면 로그인 상태에서 직접 스크린샷을 찍어 함께 넘기세요.
