# 컬러 시스템 (Color System) — 전면 교체용 참조

> **목적**: 소핏 전체 컬러를 새 팔레트로 갈아끼우기 위한 자립형 참조 문서.
> 이 문서 하나로 (1) 현재 색이 어디에 정의돼 있고 (2) 어디까지 자동 전파되며 (3) 어디는 손으로 고쳐야 하는지 파악할 수 있다.
> 새 팔레트를 클로드 디자인에 맡길 때는 **"역할 → hex" 표만 채워서** 넘기면 된다.

---

## 0. 한눈에 — 색이 사는 곳 4군데

| # | 위치 | 방식 | 교체 시 전파 | 변경 대상? |
|---|---|---|---|---|
| 1 | [`src/app/globals.css`](../src/app/globals.css) `@theme inline` | 디자인 토큰 (CSS 변수 → Tailwind 유틸) | **앱 전역 자동** (102개 파일, `bg-brand` 등 시맨틱 클래스) | ✅ 여기가 앱의 단일 소스 |
| 2 | [`src/app/landing.css`](../src/app/landing.css) `:root` + 본문 | 별도 팔레트 + **하드코딩 hex 다수** | 변수분만 자동, **하드코딩은 수동** | ✅ 별도 관리 필요 |
| 3 | [`sofitLandingData.ts`](../src/components/landing/sofitLandingData.ts) `MARKUP` | HTML 문자열 내 inline `style` hex | ❌ 자동 안 됨 | ✅ 수동 (색 스와치·그라데이션) |
| 4 | [`login/page.tsx`](../src/app/login/page.tsx), [`opengraph-image.tsx`](../src/app/opengraph-image.tsx) | 하드코딩 hex | ❌ 자동 안 됨 | ⚠️ 카카오/네이버는 **고정(변경 금지)**, OG는 선택 |

> **원칙**: 앱 UI는 #1만 고치면 끝. 랜딩(#2·#3)은 별도 세트라 따로 고쳐야 함. #4의 소셜 브랜드색은 절대 토큰화·변경 금지.

---

## 1. 앱 토큰 — `globals.css` `@theme inline` (단일 소스)

앱 전역에서 `bg-brand`, `text-ink`, `border-border` 같은 시맨틱 Tailwind 클래스로 쓰인다.
**아래 값만 바꾸면 앱 화면 전체가 따라 바뀐다.** (943회 사용 / 102개 파일 — 전부 토큰 경유)

### 1-1. Brand (SOFIT Blue 단일 통일)
| 토큰 | 현재값 | Tailwind 예 | 역할 |
|---|---|---|---|
| `--color-brand` | `#0064FF` | `bg-brand` `text-brand` | 주 브랜드 / 1차 CTA |
| `--color-brand-hover` | `#004FCC` | `hover:bg-brand-hover` | 버튼 hover |
| `--color-brand-active` | `#003D99` | `active:bg-brand-active` | 버튼 active |
| `--color-brand-tint` | `#E8F1FF` | `bg-brand-tint` | 연한 배경 / 포커스 링 |
| `--color-brand-tint-strong` | `#C9DEFF` | `bg-brand-tint-strong` | 진한 틴트 |

### 1-2. 랜딩 별칭 (`sofit-*`) — brand와 동일 계열, 랜딩 컴포넌트가 참조
| 토큰 | 현재값 | 비고 |
|---|---|---|
| `--color-sofit-blue` | `#0064FF` | = brand |
| `--color-sofit-blue-hover` | `#004FCC` | |
| `--color-sofit-blue-tint` | `#E8F1FF` | |
| `--color-sofit-ink` | `#191F28` | |
| `--color-sofit-gray` | `#8B95A1` | |
| `--color-sofit-surface` | `#F8F9FA` | |
| `--color-sofit-feature` | `#F0F6FF` | |
| `--color-sofit-black` | `#0A0A0A` | |
| `--color-sofit-navy` | `#191F28` | |

### 1-3. Neutral (surface / ink scale)
| 토큰 | 현재값 | 역할 |
|---|---|---|
| `--color-ink` | `#1A1F36` | 본문 최진하게 / 제목 |
| `--color-ink-muted` | `#4F566B` | 보조 텍스트 |
| `--color-ink-subtle` | `#8792A2` | 플레이스홀더 / 캡션 |
| `--color-canvas` | `#F6F8FB` | 페이지 배경 |
| `--color-surface` | `#FFFFFF` | 카드 / 패널 |
| `--color-surface-muted` | `#F0F3F8` | 은은한 구획 배경 |
| `--color-border` | `#E3E8EE` | 기본 테두리 |
| `--color-border-strong` | `#D5DBE3` | 강조 테두리 / 스크롤바 |

### 1-4. Semantic (상태색)
| 토큰 | 현재값 | 역할 |
|---|---|---|
| `--color-success` | `#1A7F64` | 완료 / 성공 |
| `--color-success-tint` | `#E6F4EF` | 성공 배경 |
| `--color-warning` | `#9A6700` | 경고 |
| `--color-warning-tint` | `#FBF3E0` | 경고 배경 |
| `--color-danger` | `#E5484D` | 오류 / 필수 표시 |
| `--color-danger-tint` | `#FDECEC` | 오류 배경 / 포커스 링 |

### 1-5. Radius / Shadow (색 아님 — 교체 대상 아니지만 같은 블록에 있음)
```
--radius-card: 0.625rem;   /* 10px */
--radius-control: 0.375rem;/* 6px  */
--radius-pill: 9999px;
--shadow-card:       0 1px 1px rgb(0 0 0 / .03), 0 2px 5px rgb(26 31 54 / .06);
--shadow-card-hover: 0 4px 14px rgb(26 31 54 / .10);
--shadow-pop:        0 8px 28px rgb(26 31 54 / .14);
```
> shadow의 `rgb(26 31 54 …)`는 ink(#1A1F36) 계열. 새 팔레트에서 ink 색조가 크게 바뀌면 shadow rgb도 맞춰 조정 권장.

---

## 2. 랜딩 팔레트 — `landing.css` (별도 세트, 주의)

랜딩은 `claude.ai/design` 원본에서 추출한 CSS라 **앱 토큰과 분리된 자체 변수**를 쓴다.
`.sofit-landing` 스코프 안에서만 유효.

### 2-1. `:root` 변수 (2026-07 앱 토큰과 통일 완료 ✓)
공유 시맨틱 토큰은 모두 앱 값으로 수렴시켰다. 랜딩 전용 다크 토큰만 남는다.
| 변수 | 현재값(=앱) | 비고 |
|---|---|---|
| `--ink` | `#1A1F36` | 앱 ink와 동일 |
| `--ink-muted` | `#4F566B` | 동일 |
| `--ink-subtle` | `#8792A2` | 동일 |
| `--canvas` | `#F6F8FB` | 동일 |
| `--surface` | `#FFFFFF` | 동일 |
| `--surface-muted` | `#F0F3F8` | 동일 |
| `--border` | `#E3E8EE` | 동일 |
| `--border-strong` | `#D5DBE3` | 동일 |
| `--accent` | `#0064FF` | brand와 동일 |
| `--accent-hover` | `#004FCC` | brand-hover와 동일 |
| `--accent-tint` | `#E8F1FF` | brand-tint와 동일 |
| `--accent-deep` | `#0046B8` | 랜딩 전용(그라데이션 심화용) |
| `--success` / `--success-tint` | `#1A7F64` / `#E6F4EF` | 동일 |
| `--warning` / `--warning-tint` | `#9A6700` / `#FBF3E0` | 동일 |
| `--danger` | `#E5484D` | 앱과 통일 (구 `#C0123C` 크림슨 폐기) |
| `--danger-tint` | `#FDECEC` | 앱과 통일 (구 `#FCE8EC` 폐기) |
| `--ink-900` | `#0B1220` | 랜딩 전용 다크 섹션 배경 |
| `--ink-800` | `#131A26` | 랜딩 전용 다크 섹션 배경 |

> **완료**: 앱·랜딩 공유 팔레트를 앱 값 기준으로 통일. `#C0123C`(진한 크림슨)는 저장소 전체에서 제거됨 — 다시 도입 금지.

### 2-2. 하드코딩 hex (변수 밖 — 수동 교체 필요) ⚠️
`landing.css` 본문에 변수를 안 거치는 색이 다수. 새 팔레트로 갈면 **여기도 직접 고쳐야 함**:
- 다크 섹션 텍스트/포인트: `#5B9BFF`(밝은 블루 강조), `#9AA4BE`, `#8E98B2`, `#6B7490`, `#A6AEBE`, `#E6E9F2`
- 다크 배경/푸터: `#0A0F1C`(푸터), `#5B6480`
- 히어로 그라데이션: `#DCEBFF`, `#F4F9FF`, `#F5F9FF`, `#FBFCFE`
- 상태 배지 rgba: `rgba(52,199,123,.16)`/`#34C77B`(done), `rgba(91,155,255,.2)`/`#5B9BFF`(now), `rgba(255,255,255,.06)`(wait)
- 브라우저 목업 신호등: `#FF5F57` `#FEBC2E` `#28C840` (macOS 트래픽 라이트 — 관례색, 보통 유지)
- 버튼: `.btn-white:hover` `#F2F4FF`

---

## 3. 랜딩 마크업 inline hex — `sofitLandingData.ts` `MARKUP` ⚠️

HTML 문자열 안에 `style="background:#..."` 로 박힌 색. 변수/토큰 무관 → 수동:
- 공장 스와치 배경: `#0064FF`(brand), `#1A7F64`(success), `#9A6700`(warning), `#E5484D`(danger) — 4색 로테이션
- 케이스 카드 그라데이션: `linear-gradient(135deg,#0064FF,#0046B8)`, `#1A7F64,#0F5A47`, `#9A6700,#6E4A00`
- 푸터 로고 강조: `#5B9BFF`
> 이 4색 스와치 세트는 "브랜드/성공/경고/위험" 시맨틱을 그대로 쓰므로, 새 팔레트의 동일 4역할 hex로 치환하면 됨.

---

## 4. 고정색 / 예외 (변경 금지 또는 무관)

| 위치 | 색 | 처리 |
|---|---|---|
| `login/page.tsx` 카카오 버튼 | `bg-[#FEE500]` / 텍스트 `#191919` | 🔒 **카카오 브랜드 고정 — 절대 변경·토큰화 금지** |
| `login/page.tsx` 네이버 버튼 | `bg-[#03C75A]` / 텍스트 흰색 | 🔒 **네이버 브랜드 고정 — 절대 변경·토큰화 금지** |
| `opengraph-image.tsx` | `#111111` `#ffffff` `#aaaaaa` `#666666` | ⚠️ OG 이미지 정적 생성. 앱과 별개. 원하면 브랜드 맞춰 조정 |
| `fieldSchemas.ts` `#F5F5DC` | — | ℹ️ 실제 색 아님. "색상 코드" 입력 필드의 **예시 텍스트**. 건드리지 말 것 |

---

## 5. 새 팔레트 넘길 때 — 채워야 할 표

클로드 디자인에 맡길 땐 아래 **역할** 기준으로 새 hex만 정해주면 위 전 구간에 매핑 가능:

```
Brand      : base / hover / active / tint / tint-strong / deep(랜딩)
Neutral    : ink / ink-muted / ink-subtle / canvas / surface / surface-muted / border / border-strong
Dark(랜딩) : ink-900 / ink-800 / (다크 섹션 텍스트·포인트 블루)
Semantic   : success(+tint) / warning(+tint) / danger(+tint)
스와치 4색 : brand / success / warning / danger  (랜딩 공장·케이스용)
```

### 적용 체크리스트 (교체 실행 시)
- [ ] `globals.css` `@theme` 값 교체 → 앱 전역 반영 확인
- [ ] `landing.css` `:root` 변수 교체
- [ ] `landing.css` 본문 하드코딩 hex(2-2) 교체
- [ ] `sofitLandingData.ts` MARKUP inline hex(3) 교체
- [ ] shadow의 ink 계열 rgb 조정 여부 판단
- [ ] 카카오/네이버 색은 **그대로 뒀는지** 재확인 (🔒)
- [ ] 앱↔랜딩 팔레트 통합/수렴 여부 결정
- [ ] `npx tsc --noEmit` + 주요 화면 스크린샷으로 육안 검증
