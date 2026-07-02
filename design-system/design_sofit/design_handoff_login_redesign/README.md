# Handoff: Login / Signup Page Redesign (SOFIT)

## Overview
Redesign of the SOFIT login/signup page. Moves from a single centered card to a split two-column layout: a brand panel (left) with the value proposition, and the auth form (right) with social login, an email login/signup tab switcher, and legal copy. Goal: keep the existing Stripe-style restrained visual language and brand blue (#0064FF), but raise the polish, hierarchy, and micro-interactions.

## About the Design Files
The file in this bundle (`auth.html`) is a **design reference built in static HTML/CSS/JS** — it shows the intended look, spacing, and interaction behavior. It is **not production code to copy directly**. The task is to **recreate this design in the target codebase's existing environment** — **Next.js (App Router) + React Server Components + Tailwind CSS v4** — using the app's established patterns (existing server actions, existing `useActionState` auth hooks, existing routing).

This is a **redesign of an existing production page**. The current implementation's functional contract (below) must be preserved exactly — only markup/classes/visual layout should change.

## Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, and interaction states shown in `auth.html` are final — implement pixel-close, not just "inspired by."

## Functional contract — DO NOT CHANGE
This page redesign sits on top of real auth wiring that already exists in the codebase. Preserve exactly:

- `page.tsx` stays an **`async` Server Component** — do not add `'use client'` to it.
- Kakao/Naver login are **server actions**: `<form action={signInWithKakao}>` / `<form action={signInWithNaver}>`. Do not convert to `onClick` handlers or client-side calls.
- Each of those forms contains a hidden redirect field: `{safeNext && <input type="hidden" name="next" value={safeNext} />}`. Keep it in both.
- `safeNext` parsing (open-redirect guard), from `searchParams`:
  ```ts
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined
  ```
- The email login/signup UI mounts as `<EmailAuthForm next={safeNext} />` (a separate `'use client'` component). Keep this component boundary — don't inline its state into the server component.
- Inside `EmailAuthForm`: login form posts through `signInWithEmail` and signup form posts through `signUpWithEmail`, both via `useActionState`. Signup requires a `name`, `email`, `password` (min length 8), and a **required** terms/privacy checkbox named `agreed`. Error text renders in a danger color, success message (signup) in a success color.
- Kakao button background is the fixed brand color `#FEE500` (text `#191919`); Naver button background is fixed `#03C75A` (white text/icon). These are legal brand colors — never map them to design tokens or let them shift with theme.
- Keep the "이용약관"(terms) / "개인정보처리방침"(privacy) links and the "홈으로"/"홈으로 돌아가기" (back to home) links — legal + UX requirement.

## Design Tokens
Use the codebase's Tailwind v4 `@theme` tokens (already defined in `globals.css`) — do not hardcode arbitrary hex values except the two social brand colors called out above.

```css
--color-brand: #0064FF;
--color-brand-hover: #004FCC;
--color-brand-active: #003D99;
--color-brand-tint: #E8F1FF;
--color-brand-tint-strong: #C9DEFF;

--color-ink: #1A1F36;
--color-ink-muted: #4F566B;
--color-ink-subtle: #8792A2;
--color-canvas: #F6F8FB;
--color-surface: #FFFFFF;
--color-surface-muted: #F0F3F8;
--color-border: #E3E8EE;
--color-border-strong: #D5DBE3;

--color-success: #1A7F64;
--color-danger: #E5484D;

--radius-card: 0.625rem;    /* 10px → rounded-card */
--radius-control: 0.375rem; /* 6px  → rounded-control */
--radius-pill: 9999px;      /* → rounded-pill */

--shadow-card: 0 1px 1px rgb(0 0 0 / 0.03), 0 2px 5px rgb(26 31 54 / 0.06);
--shadow-card-hover: 0 4px 14px rgb(26 31 54 / 0.10);
--shadow-pop: 0 8px 28px rgb(26 31 54 / 0.14);
```

Font: Pretendard (already applied globally in the app — no per-component font declaration needed).

## Screens / Views

### Screen: Login / Signup — split layout
**Purpose**: Entry point for both existing users (Kakao/Naver/email login) and new signups.

**Layout**: One CSS grid, `100vh` tall, two columns on desktop (`grid-template-columns: minmax(320px, 40%) 1fr`), single column on mobile (`≤860px` — brand panel is hidden entirely, form panel becomes the whole screen with a small centered mobile logo lockup in its place). No page scroll — all content is sized to fit one viewport height.

**Left column — brand panel** (hidden below 860px):
- Full-bleed background: brand blue `#0064FF`.
- Two decorative overlays, both purely CSS, no images: (1) two soft radial-gradient glows in white at low opacity (12% at bottom-left, 10% at top-right) for depth; (2) a very faint 22px dot grid (`radial-gradient` repeating dot, ~16% white opacity) masked to fade in/out vertically (`mask-image: linear-gradient(180deg, transparent, black 55%, transparent)`).
- Padding `36px 44px 28px`. Flex column, `justify-content: space-between`.
- Top: wordmark "소핏", 22px / 800 weight, white.
- Middle (vertically centered via `margin: auto` top/bottom): headline "인테리어의 모든 공정,<br>검증된 공장과 함께" (28px/800/-.03em/line-height 1.3, white), sub copy below (14.5px/500, white @ 78% opacity, max-width 340px), then a 3-item checklist (10px gap) — each item is a circled-checkmark icon (18px, white stroke on translucent white ring) + 14.5px/600 white-at-92% label. Labels: "실측부터 시공까지 한 번에", "검증된 공장만 매칭", "여러 견적 비교, 투명한 가격".
- Bottom: "© 2026 SOFIT", 12.5px, white @ 56% opacity.

**Right column — form panel**:
- White background, flex column, centered content, `padding: 20px 32px`, vertically centered via `justify-content: center`, `overflow-y: auto` as a safety net (should not be needed at normal viewport sizes).
- Top-left absolute-positioned back link: "← 홈으로", 13.5px/600, `ink-muted`, hover → `ink`.
- Content column is capped at `max-width: 376px`, centered.
- **Mobile-only lockup** (shown only ≤860px, replaces the hidden brand panel): centered "소핏" wordmark (21px/800, brand blue) + tagline "인테리어의 모든 공정, 검증된 공장 매칭" (13.5px, `ink-muted`).
- **Heading block**: h1 (21px/800/-.03em, `ink`) + subtext (13.5px/500, `ink-muted`), both swap text when the login/signup tab changes (see Interactions).
  - Login state: "다시 만나서 반가워요" / "계정으로 로그인하고 견적을 이어가세요"
  - Signup state: "계정 만들기" / "몇 초면 가입이 끝나요"
- **Social buttons** (stacked, 8px gap): each is full-width, 44px tall, `rounded-card` (10px), 14px/700 text, icon (18px) + label, centered.
  - Kakao: bg `#FEE500`, text `#191919`, icon is the Kakao speech-bubble mark in `#191919`. Hover: brightness 0.96.
  - Naver: bg `#03C75A`, white text, icon is the Naver "N" mark in white. Hover: brightness 0.94.
  - Both: `active:translate-y-px` press feedback.
- **Divider**: centered "또는" label on a horizontal rule, 14px vertical margin, label is 12.5px/600 `ink-subtle` on a white background patch so it interrupts the rule.
- **Login/signup pill tabs**: track is `surface-muted` background, `rounded-card`, 4px padding, two equal-width buttons ("로그인" / "회원가입", 13.5px/700). A white pill (`shadow-card`) slides between the two positions via `transform: translateX()` on a `200ms ease-out` transition, driven by a `data-mode` attribute / React state — not two separately-styled buttons toggling background individually.
- **Email form** (only one of the two panes visible at a time, based on tab state):
  - *Login pane*: email input, password input (8px gap, both 42px tall inputs, `rounded-card`, `border`, focus → `border-brand` + 3px `brand-tint` ring), then primary submit button "이메일로 로그인" — 44px, `rounded-control` (6px — intentionally tighter radius than the card inputs above it), bg `brand`, hover `brand-hover`, disabled state shows "로그인 중..." at 50% opacity.
  - *Signup pane*: name, email, password (min 8 chars) inputs (same styling), then a required checkbox row — 16px checkbox (brand accent color) + 12.5px `ink-muted` text with bold underlined links to terms/privacy and a red bold "(필수)" required marker — then a dark submit button "이메일로 회원가입", 44px, `rounded-card` (10px — deliberately more rounded than the login button), bg `ink`, hover opacity 0.92, disabled shows "가입 중..." at 50% opacity.
  - Error text (from server action state) renders centered, 12px, `danger` color, above the submit button. Signup success message renders the same way in `success` color.
- **Legal line**: centered, 11.5px, `ink-subtle`, "로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다." with the two nouns as underlined links.
- **Home link**: centered below that, "← 홈으로 돌아가기", 13.5px/600, `ink-muted` → `ink` on hover.

## Interactions & Behavior
- **Tab switch (로그인 ⇄ 회원가입)**: clicking a tab (a) moves the sliding white pill indicator via CSS transform (200ms ease-out), (b) toggles which form pane is visible (`display: none` / `flex` — not unmounted, just hidden, so no layout jump), (c) updates the h1/subtext copy above the tabs to match the selected mode. In React this is one `useState<'login'|'signup'>` driving all three.
- **Button presses**: social + submit buttons nudge down 1px on `:active` for tactile feedback.
- **Hover states**: social buttons brighten slightly; links (`back`, `home-link`, tab labels) shift from muted to full `ink` color; primary button darkens to `brand-hover`; dark button fades to 92% opacity.
- **Focus states**: text inputs get a `brand` border + a soft 3px `brand-tint` focus ring (no default browser outline).
- **Disabled/pending states**: while a server action is pending, the relevant submit button is disabled (50% opacity, pointer-events effectively off via `disabled`) and its label swaps to a "…중" loading variant.
- **Responsive**: at `≤860px` the brand panel is removed from the layout entirely (not just hidden — the grid collapses to one column) and the mobile logo lockup takes its place at the top of the form column. No other behavior changes at this breakpoint.
- **No page scroll**: the whole screen is designed to fit one viewport height (`100vh`) at typical desktop/laptop sizes without scrolling. `overflow-y: auto` on the form column is a safety net only, not the primary sizing strategy — sizing (paddings, gaps, font sizes, control heights) was intentionally compressed to fit within one screen.

## State Management
- `mode: 'login' | 'signup'` — local component state in `EmailAuthForm`, drives tab indicator position, which form pane renders, and the heading copy above it.
- Two independent `useActionState` instances (one per form) for `signInWithEmail` / `signUpWithEmail` — each yields `{ error?, message? }` plus a `pending` boolean, exactly as in the current implementation.
- `safeNext` is computed once in the server component and threaded down as a prop / hidden input — not stored in client state.

## Assets
No image assets are needed to implement this — all iconography (Kakao mark, Naver mark, checkmarks, chevrons) is inline SVG, and all "brand visual" texture on the left panel is pure CSS (gradients + masked dot pattern).

Reference screenshots (renders of `auth.html`, for quick visual context without opening the file) are included in `screenshots/`:
- `01-auth.png` — login tab active (default state)
- `02-auth.png` — signup tab active (pill indicator + form pane swapped)

## Files
- `auth.html` — the full design reference (open directly in a browser). Contains all markup, inline CSS, and a small vanilla-JS tab-switch script standing in for what should become React state in `EmailAuthForm.tsx`.
- `screenshots/01-auth.png`, `screenshots/02-auth.png` — static renders of the two tab states, for reference alongside the live HTML.
