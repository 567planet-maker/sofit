# DEV_MASTER — SOFIT 개발 마스터 플랜

> 기준 문서: `PRD_CoreMVP.md` (Phase 0)
> 참조 문서: `MVP_SCOPE.md` / `DB_SCHEMA.md` / `UI_FLOW.md`
> 개발 방식: 1인 직접 개발 | 목표: **8주 완료** | 월 비용: **0원**

---

## 기술 스택

| 영역 | 도구 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | 풀스택 단일 레포 |
| 언어 | TypeScript | 엄격 모드 |
| 스타일 | Tailwind CSS | |
| 폼 | React Hook Form + Zod | |
| DB / Auth / Storage / Realtime | Supabase (Free) | 올인원 |
| 호스팅 | Vercel Hobby (무료) | |
| 코드 관리 | GitHub Private | |
| **월 비용** | **0원** | |

Phase 0에서 제외: GPT-4o, 토스페이먼츠, Make, 솔라피 → `MVP_SCOPE.md` 참조

---

## 8주 개발 순서

```
W1  인프라 셋업
W2  DB 스키마 + 인증
W3  랜딩페이지 + 견적 요청 폼
W4  파일 업로드 + 고객 화면
W5  공장 화면
W6  관리자 화면 ★ (핵심)
W7  채팅 + 알림
W8  통합 테스트 + 천일쇼파 입점 + 배포
```

---

## W1 — 인프라 셋업

**완료 기준**: Vercel에 Next.js 배포 확인, Supabase 연결 확인

### Day 1~2: 프로젝트 초기화

- [x] GitHub Private 레포 생성 (`sofit`)
- [x] Next.js 14 프로젝트 생성
  ```bash
  npx create-next-app@latest sofit --typescript --tailwind --app --eslint --src-dir
  ```
- [x] 폴더 구조 세팅
  ```
  src/
    app/           # 페이지 (App Router)
    components/    # 공통 컴포넌트
    lib/           # supabase 클라이언트, 유틸
    types/         # 타입 정의
  ```
- [x] `.prettierrc` 설정
- [x] `.env.local` 생성 + `.gitignore` 포함 확인 ← 보안 필수
- [x] GitHub 첫 커밋·푸시

### Day 2~3: Vercel 배포 파이프라인

- [x] Vercel 계정 생성 → GitHub 레포 연결
- [x] Vercel Hobby 자동 배포 확인 (푸시 → 자동 빌드)
- [x] 배포 URL 접속 확인

### Day 3~4: Supabase 셋업

- [x] Supabase 프로젝트 생성 (Region: Northeast Asia - Tokyo)
- [x] 환경변수 복사 → `.env.local` 입력
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=   ← NEXT_PUBLIC_ 절대 금지
  ```
- [x] Vercel 환경변수 동일하게 등록
- [x] Supabase 패키지 설치
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [x] `src/lib/supabase/client.ts` — 브라우저용
- [x] `src/lib/supabase/server.ts` — 서버용 (cookies 기반)
- [x] 연결 테스트 확인

---

## W2 — DB 스키마 + 인증

**완료 기준**: 소셜 로그인 동작, 역할별 라우트 보호, RLS 적용
**상세 스키마**: `DB_SCHEMA.md` 참조

### DB 스키마 생성 (Supabase SQL 에디터)

- [x] `users` 테이블 생성 + 신규 가입 트리거
- [x] `customers` 테이블 생성
- [x] `factories` 테이블 생성
- [x] `factory_portfolios` 테이블 생성
- [x] `quote_requests` 테이블 생성
- [x] `request_files` 테이블 생성
- [x] `matches` 테이블 생성
- [x] `factory_quotes` 테이블 생성
- [x] `chat_rooms` 테이블 생성
- [x] `chat_messages` 테이블 생성
- [x] `notifications` 테이블 생성
- [x] `status_logs` 테이블 생성
- [x] 인덱스 전체 생성

### RLS 설정

- [x] 전체 테이블 RLS 활성화
- [x] `get_my_role()` 헬퍼 함수 생성
- [x] 각 테이블 정책 적용 (상세: `DB_SCHEMA.md`)
- [ ] 역할별 RLS 테스트
  - [ ] 고객 계정으로 타인 견적 조회 불가 확인 ← W8 통합테스트
  - [ ] 공장 계정으로 미매칭 요청 조회 불가 확인 ← W5 공장 계정 생성 후
  - [x] admin은 전체 조회 확인 (nav 관리자 링크 노출 확인)

### 인증 시스템

- [x] **카카오 소셜 로그인** (커스텀 OAuth — 비즈니스 인증 전 임시)
  - [x] 카카오 디벨로퍼 앱 등록
  - [x] 리디렉션 URL 등록
  - [x] Supabase Auth Providers에서 카카오 활성화
- [ ] **네이버 소셜 로그인**
  - [ ] 네이버 디벨로퍼 앱 등록 + Supabase 연동
- [x] **미들웨어** (`src/proxy.ts`) — Next.js 16 breaking change 대응
  - [x] `/customer/*` → customer 역할만
  - [x] `/factory/*` → factory 역할만
  - [x] `/admin/*` → admin 역할만
  - [x] 미인증 → `/login` 리디렉션
- [x] **로그인 페이지** (`/login`) — 카카오·네이버 버튼
- [x] **최초 로그인 플로우** — 역할 선택, 약관 동의
- [x] **공장 가입** — 추가 정보 입력 → `factories` INSERT (status: pending)
- [x] 로그아웃 + 세션 만료 처리
- [x] 계정 삭제 기능 (`/me`)

---

## W3 — 랜딩페이지 + 견적 요청 폼 ✅

**완료 기준**: 견적 폼 제출 → Supabase 저장 확인
**완료일**: 2026-05-27

### 랜딩페이지 (`/`)

- [x] Hero 섹션 (슬로건 + 견적 요청 CTA)
- [x] 서비스 플로우 섹션 (고객 기준 단계 카드)
- [x] 공장 포트폴리오 미리보기 섹션
- [x] 고객 페인 포인트 → 해결 섹션
- [x] 공장 입점 유도 섹션
- [x] 모바일 반응형
- [x] SEO 메타태그

### 포트폴리오 공개 페이지 (`/portfolios`)

- [x] 공장별·카테고리별 필터
- [x] 갤러리 그리드
- [x] 포트폴리오 상세 페이지 (`/portfolios/[id]`)

### 견적 요청 폼 (`/customer/request`) — 멀티스텝

화면 흐름: `UI_FLOW.md` §10 참조

- [x] 스텝 프로그레스바 컴포넌트
- [x] **Step 1** — 현장 정보 (필수 항목 검증)
- [x] **Step 2** — 제품·쇼파 정보 (선택)
- [x] **Step 3** — 규격 + 도면 업로드 (UI 구현 완료, 파일 업로드는 W4)
- [x] **Step 4** — 자재 + 매장 사진 업로드 (UI 구현 완료, 파일 업로드는 W4)
- [x] **Step 5** — 일정 + 최종 확인
- [x] 로컬스토리지 임시 저장 (새로고침 복구)
- [x] 제출 → `quote_requests` INSERT
- [x] `request_files` INSERT (`src/app/actions/quote-request.ts` 구현 완료)
- [x] 관리자 알림 생성 (notifications INSERT)
- [x] 제출 완료 페이지

---

## W4 — 파일 업로드 + 고객 화면 ✅

**완료 기준**: 파일 업로드 동작, 고객이 상태 추적 가능
**완료일**: 2026-06-01

### Supabase Storage 버킷 생성

- [x] `request-images` (10MB, jpg/png/webp, 업로더·매칭공장·admin) — RLS 정책 포함
- [x] `request-documents` (20MB, pdf/dwg/dxf, 업로더·매칭공장·admin) — RLS 정책 포함
- [x] `factory-portfolios` (10MB, jpg/png, 전체 공개) ← SQL 정책 정의 완료, 버킷은 대시보드 수동 생성
- [x] `factory-biz-docs` (20MB, pdf/jpg, admin 전용) ← SQL 정책 정의 완료, 버킷은 대시보드 수동 생성
- [x] `progress-photos` (10MB, jpg/png, 해당공장·고객·admin) ← SQL 정책 정의 완료, 버킷은 대시보드 수동 생성
- [ ] `chat-attachments` (20MB, jpg/png/pdf, 채팅참여자·admin) ← W7

### `FileUploader` 컴포넌트

- [x] 드래그앤드롭 + 클릭 업로드
- [x] 이미지 미리보기 썸네일
- [x] 파일 삭제 (Storage에서도 제거)
- [x] 업로드 진행 상태 표시 (업로드 중... / ✓ 완료)
- [x] 확장자·크기 제한 클라이언트 검사

### 고객 화면

- [x] **내 견적 목록** (`/customer/requests`)
  - [x] 상태별 탭 필터 (URL 쿼리 파라미터)
  - [x] `StatusBadge` 컴포넌트 (색상 구분)
- [x] **견적 상세** (`/customer/requests/[id]`)
  - [x] 입력한 폼 내용 열람
  - [x] 업로드 사진·도면 서명URL 갤러리
  - [x] 상태 변경 타임라인 (`status_logs` 기반)
  - [x] 채팅 버튼 (customer_sofit 채팅방)
- [x] **공장 견적서 비교** (`/customer/requests/[id]/quotes`)
  - [x] `QuoteCard` 컴포넌트 (총액·납기·포트폴리오 링크)
  - [x] 가격·납기 고객에게만 노출

---

## W5 — 공장 화면 ✅

**완료 기준**: 공장이 가입·포트폴리오 등록·견적서 제출 가능
**완료일**: 2026-06-01

### 공장 온보딩

- [x] 추가 정보 입력 (`/factory/onboarding`)
  - [x] 회사명·위치·소개
  - [ ] 사업자등록증 업로드 → `factory-biz-docs` ← 관리자 승인 화면(W6)과 연계
- [x] 심사 대기 페이지 (`/factory/pending`)

### 공장 대시보드

- [x] **홈** (`/factory`) — 통계 카드(신규 매칭·수락·견적서) + 최근 매칭 목록 + 빠른 링크
- [x] **포트폴리오 관리** (`/factory/portfolios`)
  - [x] 작업 사례 등록·수정·삭제
  - [x] 이미지 업로드 → `factory-portfolios`
- [x] **매칭된 요청 목록** (`/factory/requests`)
  - [x] 탭 필터 (전체/신규/수락됨/거절됨)
  - [x] 요청 상세 (고객 정보·폼·사진)
- [x] **수락/거절** (`/factory/requests/[id]`)
  - [x] [수락하기] → `matches.status = 'confirmed'` + 견적서 폼 활성화
  - [x] [거절하기] → `matches.status = 'rejected'` + 사유 입력 + 관리자 알림
- [x] **견적서 작성** (`/factory/requests/[id]`)
  - [x] matches.status='confirmed'일 때만 폼 표시
  - [x] 항목별 금액 입력(재료비·인건비·배송비·설치비·철거비·기타·마진) + 총액 자동 계산
  - [x] 납기일(일수) 입력
  - [x] 임시저장 기능
  - [x] [고객에게 제출하기] → `factory_quotes` INSERT(status=submitted) + 고객 알림 + quote_request.status → quote_arrived
- [x] **진행 프로젝트** (`/factory/projects`)
  - [x] 계약완료·시공중 프로젝트 목록
  - [x] 진행 사진 업로드 → `progress-photos` 버킷 + `progress_photos` 테이블
  - [x] 고객과 직접 채팅 연결 버튼 (`customer_factory` 채팅방)

### DB·스토리지 추가 (migration 002_w5_storage.sql)

- [x] `progress_photos` 테이블 + RLS
- [x] `matches` 테이블 공장 UPDATE 정책 추가
- [x] `notifications` 테이블 INSERT 정책 추가
- [x] `chat_rooms.type`에 `customer_factory` 추가
- [x] `factory-portfolios` 버킷 생성 (Supabase 대시보드 수동)
- [x] `factory-biz-docs` 버킷 생성 (Supabase 대시보드 수동)
- [x] `progress-photos` 버킷 생성 (Supabase 대시보드 수동)

---

## W6 — 관리자 화면 ★ ✅

**완료 기준**: 관리자가 견적 수령 → 검수 → 매칭 → 견적 전달 전 과정 처리 가능
**완료일**: 2026-06-02

> AI가 없으므로 이 화면이 소핏의 실질적 운영 두뇌.
> 화면 흐름: `UI_FLOW.md` §6 참조

### 관리자 레이아웃

- [x] 사이드바 (미처리 건수 뱃지 포함) — `AdminNav.tsx` + `layout.tsx`
- [x] 관리자 역할 강제 미들웨어 확인 (layout에서 role 체크)

### 전체 견적 요청 목록 (`/admin/requests`)

- [x] 상태별 탭 필터
- [x] 컬럼: 접수일·업체명·현장명·업종·상태
- [x] 새 요청 강조 표시 (submitted 행 하이라이트)

### 요청 상세 (`/admin/requests/[id]`)

- [x] 고객 폼 전체 열람
- [x] 사진·도면 갤러리 뷰어 (서명URL)
- [x] 상태 변경 드롭다운 → `status_logs` INSERT + 고객 알림
- [x] 공장 매칭 현황 표시 (수락/거절/검토중)
- [x] 관리자 내부 메모 필드 (비공개) — `AdminNoteEditor.tsx`
- [x] "공장 매칭 관리" 버튼 → `/admin/requests/[id]/match`

### 공장 매칭 (`/admin/requests/[id]/match`)

- [x] 활성 공장 카드 목록 (이미 배포된 공장 제외)
- [x] [배포] 클릭 → `matches` INSERT + 공장 알림 + 요청 상태 matching 전환
- [x] 매칭 이력 + 배포 취소 기능 (pending만 취소 가능)
- [x] 수락된 공장에 고객↔공장 채팅방 생성 버튼

### 공장 관리 (`/admin/factories`)

- [x] 승인 대기·활성·정지·반려 탭 필터
- [x] 공장 상세 (`/admin/factories/[id]`)
  - [x] 사업자등록증 서명URL 열람/다운로드
  - [x] 포트폴리오 갤러리
  - [x] 승인/반려 처리 + 공장 알림 — `FactoryActions.tsx`
  - [x] 정지·재활성화 처리

### 채팅 통합 뷰 (`/admin/chats`)

- [x] 전체 채팅방 목록 (미답변 우선 정렬)
- [x] 채팅방 선택 → 메시지 표시 + 전송 (customer_sofit)
- [x] customer_factory 방은 읽기 전용 모니터링

### 사용자 관리 (`/admin/users`)

- [x] 고객·공장·관리자 역할별 탭 필터
- [x] 공장 계정 → 공장 상세 링크

### 서버 액션 (`src/app/actions/admin.ts`)

- [x] `changeRequestStatus` — 상태 변경 + status_logs INSERT + 고객 알림
- [x] `updateAdminNote` — 관리자 메모 저장
- [x] `createMatch` — 공장 배포 + 공장 알림
- [x] `cancelMatch` — 배포 취소
- [x] `createCustomerFactoryChat` — 고객↔공장 채팅방 생성
- [x] `approveFactory` — 공장 승인 + 알림
- [x] `rejectFactory` — 공장 반려 + 알림
- [x] `suspendFactory` / `activateFactory` — 공장 정지/재활성화
- [x] `sendAdminMessage` — 관리자 메시지 전송

---

## W7 — 채팅 + 알림 ✅

**완료 기준**: 실시간 채팅 동작, 새 메시지 시 알림 뱃지 업데이트
**완료일**: 2026-06-04

### 채팅 시스템 (Supabase Realtime)

- [x] `ChatRoom` 공통 컴포넌트 (`src/components/chat/ChatRoom.tsx`)
  - [x] 메시지 리스트 (초기 로드 후 Realtime 신규 메시지 append)
  - [x] 새 메시지 자동 스크롤
  - [x] 메시지 입력창 + 전송 (Ctrl+Enter 단축키)
  - [x] 파일 첨부 (이미지·PDF → `chat-attachments`)
  - [x] 읽음 처리 (`read_at` UPDATE)
  - [x] 읽기 전용 모드 (admin이 customer_factory 방 모니터링 시)
- [x] Supabase Realtime 구독
  ```typescript
  supabase.channel(`room:${roomId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`
    }, handler)
    .subscribe()
  ```
- [x] **고객 채팅** (`/customer/chat/[roomId]`) — customer_sofit + customer_factory 모두 표시
- [x] **공장 채팅** (`/factory/chat/[roomId]`) — 매칭 확정 후 고객과 직접 채팅
- [x] **관리자 통합 뷰** (`/admin/chats/[roomId]`) — W6에서 구현 완료
  - [x] customer_sofit: 양방향 소통
  - [x] customer_factory: 읽기 전용 모니터링
- [x] 견적 요청 제출 시 `customer_sofit` 채팅방 자동 생성
- [x] 매칭 확정 시 `customer_factory` 채팅방 자동 생성 (고객↔공장 직접 채팅)

### 웹 내 알림 시스템

- [x] `src/lib/notifications.ts` — 알림 생성 함수 (W2에서 구현, W7에서 확장)
- [x] 알림 트리거 연결 (이벤트 발생 지점마다)
  - [x] 견적 요청 제출 → 관리자
  - [x] 공장 매칭 → 공장
  - [x] 공장 수락/거절 → 관리자
  - [x] 견적서 제출 → 고객 (직접)
  - [x] 새 채팅 메시지 → 상대방 (`src/app/actions/chat.ts`)
  - [x] 상태 변경 → 해당 사용자
  - [x] 공장 승인/반려 → 공장
- [x] `NotificationBell` 컴포넌트 (`src/components/notifications/NotificationBell.tsx`)
  - [x] 읽지 않은 알림 카운트 (Realtime 구독)
  - [x] 드롭다운 (최근 10개)
  - [x] 클릭 → 페이지 이동 + `read_at` UPDATE
- [x] 알림 전체 목록 (`/notifications`)

### DB·스토리지 추가 (migration 003_w7_chat.sql)

- [x] `chat_rooms` SELECT 정책 수정 (공장이 customer_factory 방 조회 가능)
- [x] `chat_rooms` INSERT 정책 추가 (고객 customer_sofit, 공장 customer_factory)
- [x] `chat_messages` INSERT 보안 강화 (방 참여자 여부 확인)
- [x] `chat_messages` UPDATE 정책 추가 (읽음 처리)
- [ ] `chat-attachments` 버킷 생성 (Supabase 대시보드 수동) + Storage 정책 적용

---

## W8 — 통합 테스트 + 배포

**완료 기준**: E2E 테스트 통과, 천일쇼파 입점, 첫 테스트 견적 1건 처리
**진행 중**: 2026-06-04~

### 기능 테스트

- [ ] **고객 E2E**: 랜딩 → 로그인 → 폼 제출 → 상태 확인 → 견적서 수신 → 채팅
- [ ] **공장 E2E**: 가입 → 심사 → 포트폴리오 → 매칭 알림 → 수락 → 견적서 고객에게 직접 제출
- [ ] **관리자 E2E**: 요청 수신 → 공장 배포 → 매칭 현황 확인 → 최종 매칭 확정 → 채팅 모니터링
- [ ] 모바일 테스트 (Chrome Android, Safari iOS)
- [ ] 파일 업로드·다운로드 (이미지, PDF)
- [ ] 채팅 실시간 (2개 탭 동시 접속)
- [ ] 알림 실시간 업데이트

### 보안 점검

- [ ] RLS: 타인 데이터 조회 불가 (역할별 브라우저 테스트 필요)
- [x] `/admin` 인증 없이 접근 불가 (layout.tsx 서버사이드 role 체크 + redirect)
- [x] `NEXT_PUBLIC_` 환경변수에 `SERVICE_ROLE_KEY` 없음 (`SUPABASE_SERVICE_ROLE_KEY` — `NEXT_PUBLIC_` 미사용 확인)
- [x] `.env.local` Git에 커밋 안 됨 (`.gitignore`의 `.env*` 패턴으로 차단)
- [ ] 파일 업로드 확장자·크기 제한 동작 (브라우저 테스트 필요)
- [ ] `factory-biz-docs` 버킷 admin 외 접근 불가 (Supabase 대시보드 확인 필요)

### 법무 페이지

- [x] `/terms` 이용약관 게시 (`src/app/terms/page.tsx`)
- [x] `/privacy` 개인정보처리방침 게시 (`src/app/privacy/page.tsx`)
- [x] 회원가입 시 동의 체크박스 연동 (`/onboarding` — 체크 전 역할 선택 비활성화)

### 천일쇼파 입점

- [ ] 공장 계정 생성 + admin에서 즉시 승인
- [ ] 포트폴리오 데이터 입력 (기존 작업 사례)
- [ ] 테스트 견적 요청 1건 → 매칭 → 견적서 → 채팅 전 과정 확인

### 배포 최종

- [x] Vercel 프로덕션 빌드 에러 없음 (로컬 `npm run build` 통과)
- [ ] 소셜 로그인 운영 URL 콜백 등록 (카카오·네이버)
- [x] 404·500 에러 페이지 (`src/app/not-found.tsx`, `src/app/error.tsx`)
- [x] 기본 OG 이미지 설정 (`src/app/opengraph-image.tsx` — edge runtime, 동적 생성)

---

## 마일스톤

| 시점 | 완료 기준 |
|------|-----------|
| **W2 말** | 소셜 로그인 동작, DB + RLS 적용, 역할 분리 확인 |
| **W4 말** | 견적 폼 제출 → DB 저장, 파일 업로드, 고객 상태 추적 |
| **W6 말** | 관리자 전 과정 운영 가능 (검수→매칭→견적 전달) |
| **W8 말** | E2E 통과, 천일쇼파 입점, 첫 테스트 견적 1건 처리 |
| **M+3** | Phase 0.5 (토스페이먼츠 + 리뷰) |
| **M+4~5** | Phase 1 (GPT-4o AI 가견적) |

---

## 병행 트랙

| 트랙 | 내용 | 시작 |
|------|------|------|
| 법무 | 이용약관·개인정보처리방침 초안 (Claude) | W1 |
| 법무 | 변호사 컨택 (사업자 등록 업종·에스크로 라이선스) | M+1~M+2 |
| 데이터 | 천일쇼파 견적서 수집·정형화 (Phase 1 자재 DB 준비) | W1 |
| 브랜딩 | 임시 로고·컬러 팔레트 | W3 전 |
| 영업 | 천일쇼파 입점 데이터 준비 | W5~W6 |
