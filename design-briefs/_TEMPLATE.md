# [화면 이름] 리디자인 브리프 (소핏 / SOFIT)

> 이 문서 하나만 클로드에게 넘기면 됩니다. 아래 코드/토큰/제약을 그대로 복붙하세요.

---

## 0. 요청 (프롬프트로 사용)

소핏(SOFIT) **[화면 이름]** 페이지를 리디자인해줘.

- 스택: **Next.js (App Router) + Tailwind CSS v4**. (서버/클라이언트 컴포넌트 여부 명시)
- **디자인 토큰만 사용**할 것. 임의 hex 색 금지, 아래 토큰 클래스(`bg-brand`, `text-ink`, `rounded-card` 등)만 사용.
- 방향(톤): **현재 톤 유지·개선**. Stripe식 절제된 레이아웃 + 브랜드 블루(#0064FF) 유지. 레이아웃을 통째로 뒤엎지 말 것.
- 아래 **"바꾸면 안 되는 것"의 기능 구조를 그대로 보존**. 마크업/클래스/구성만 변경.
- 결과물: `[대상 파일 경로]` 전체 코드.

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
--color-success: #1A7F64;  --color-danger: #E5484D;
/* Radius */  --radius-card: 10px (rounded-card);  --radius-control: 6px (rounded-control);  --radius-pill (rounded-pill)
/* Shadow */  --shadow-card;  --shadow-card-hover;  --shadow-pop
```
- Tailwind v4 유틸리티로 바로 사용: `bg-brand`, `text-ink-muted`, `border-border`, `rounded-card`, `shadow-card`.
- 폰트: **Pretendard** (전역 적용, 지정 불필요).

---

## 2. 현재 페이지 코드 (기준점)

### `[대상 파일 경로]`
```tsx
// 현재 코드 붙여넣기
```

### (연관 컴포넌트가 있으면) 인터페이스
- `[컴포넌트명]` — props / 역할 요약

---

## 3. 바꾸면 안 되는 것 (기능 — 반드시 보존)

| 요소 | 이유 |
|---|---|
| (서버 액션 form / hidden input / prop / 보안 로직 등) | (이유) |

---

## 4. 개선해도 되는 것 (자유)
- (여백/타이포/그림자/인터랙션/반응형 등)

---

## 5. 넘기지 않아도 되는 것
- 전체 코드베이스 / node_modules / 환경변수·시크릿 / 액션 내부 구현
