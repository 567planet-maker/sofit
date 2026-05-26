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

- [ ] GitHub Private 레포 생성 (`sofit`)
- [ ] Next.js 14 프로젝트 생성
  ```bash
  npx create-next-app@latest sofit --typescript --tailwind --app --eslint --src-dir
  ```
- [ ] 폴더 구조 세팅
  ```
  src/
    app/           # 페이지 (App Router)
    components/    # 공통 컴포넌트
    lib/           # supabase 클라이언트, 유틸
    types/         # 타입 정의
  ```
- [ ] `.prettierrc` 설정
- [ ] `.env.local` 생성 + `.gitignore` 포함 확인 ← 보안 필수
- [ ] GitHub 첫 커밋·푸시

### Day 2~3: Vercel 배포 파이프라인

- [ ] Vercel 계정 생성 → GitHub 레포 연결
- [ ] Vercel Hobby 자동 배포 확인 (푸시 → 자동 빌드)
- [ ] 배포 URL 접속 확인

### Day 3~4: Supabase 셋업

- [ ] Supabase 프로젝트 생성 (Region: Northeast Asia - Tokyo)
- [ ] 환경변수 복사 → `.env.local` 입력
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=   ← NEXT_PUBLIC_ 절대 금지
  ```
- [ ] Vercel 환경변수 동일하게 등록
- [ ] Supabase 패키지 설치
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] `src/lib/supabase/client.ts` — 브라우저용
- [ ] `src/lib/supabase/server.ts` — 서버용 (cookies 기반)
- [ ] 연결 테스트 확인

---

## W2 — DB 스키마 + 인증

**완료 기준**: 소셜 로그인 동작, 역할별 라우트 보호, RLS 적용
**상세 스키마**: `DB_SCHEMA.md` 참조

### DB 스키마 생성 (Supabase SQL 에디터)

- [ ] `users` 테이블 생성 + 신규 가입 트리거
- [ ] `customers` 테이블 생성
- [ ] `factories` 테이블 생성
- [ ] `factory_portfolios` 테이블 생성
- [ ] `quote_requests` 테이블 생성
- [ ] `request_files` 테이블 생성
- [ ] `matches` 테이블 생성
- [ ] `factory_quotes` 테이블 생성
- [ ] `chat_rooms` 테이블 생성
- [ ] `chat_messages` 테이블 생성
- [ ] `notifications` 테이블 생성
- [ ] `status_logs` 테이블 생성
- [ ] 인덱스 전체 생성

### RLS 설정

- [ ] 전체 테이블 RLS 활성화
- [ ] `get_my_role()` 헬퍼 함수 생성
- [ ] 각 테이블 정책 적용 (상세: `DB_SCHEMA.md`)
- [ ] 역할별 RLS 테스트
  - [ ] 고객 계정으로 타인 견적 조회 불가 확인
  - [ ] 공장 계정으로 미매칭 요청 조회 불가 확인
  - [ ] admin은 전체 조회 확인

### 인증 시스템

- [ ] **카카오 소셜 로그인**
  - [ ] 카카오 디벨로퍼 앱 등록
  - [ ] 리디렉션 URL: `https://<ref>.supabase.co/auth/v1/callback`
  - [ ] Supabase Auth Providers에서 카카오 활성화
- [ ] **네이버 소셜 로그인**
  - [ ] 네이버 디벨로퍼 앱 등록 + Supabase 연동
- [ ] **미들웨어** (`src/middleware.ts`)
  - [ ] `/customer/*` → customer 역할만
  - [ ] `/factory/*` → factory 역할만
  - [ ] `/admin/*` → admin 역할만
  - [ ] 미인증 → `/login` 리디렉션
- [ ] **로그인 페이지** (`/login`) — 카카오·네이버 버튼
- [ ] **최초 로그인 플로우** — 역할 선택, 약관 동의
- [ ] **공장 가입** — 추가 정보 입력 → `factories` INSERT (status: pending)
- [ ] 로그아웃 + 세션 만료 처리

---

## W3 — 랜딩페이지 + 견적 요청 폼

**완료 기준**: 견적 폼 제출 → Supabase 저장 확인

### 랜딩페이지 (`/`)

- [ ] Hero 섹션 (슬로건 + 견적 요청 CTA)
- [ ] 서비스 플로우 섹션 (고객 기준 단계 카드)
- [ ] 공장 포트폴리오 미리보기 섹션
- [ ] 고객 페인 포인트 → 해결 섹션
- [ ] 공장 입점 유도 섹션
- [ ] 모바일 반응형
- [ ] SEO 메타태그

### 포트폴리오 공개 페이지 (`/portfolios`)

- [ ] 공장별·카테고리별 필터
- [ ] 갤러리 그리드
- [ ] 포트폴리오 상세 모달

### 견적 요청 폼 (`/customer/request`) — 멀티스텝

화면 흐름: `UI_FLOW.md` §10 참조

- [ ] 스텝 프로그레스바 컴포넌트
- [ ] **Step 1** — 현장 정보 (필수 항목 Zod 검증)
- [ ] **Step 2** — 제품·쇼파 정보 (선택)
- [ ] **Step 3** — 규격 + 도면 업로드
- [ ] **Step 4** — 자재 + 매장 사진 업로드 (1장 이상 권장)
- [ ] **Step 5** — 일정 + 최종 확인
- [ ] 로컬스토리지 임시 저장 (새로고침 복구)
- [ ] 제출 → `quote_requests` + `request_files` INSERT
- [ ] 관리자 알림 생성 (notifications INSERT)
- [ ] 제출 완료 페이지

---

## W4 — 파일 업로드 + 고객 화면

**완료 기준**: 파일 업로드 동작, 고객이 상태 추적 가능

### Supabase Storage 버킷 생성

- [ ] `request-images` (10MB, jpg/png/webp, 업로더·매칭공장·admin)
- [ ] `request-documents` (20MB, pdf/dwg/dxf, 업로더·매칭공장·admin)
- [ ] `factory-portfolios` (10MB, jpg/png, 전체 공개)
- [ ] `factory-biz-docs` (20MB, pdf/jpg, admin 전용)
- [ ] `progress-photos` (10MB, jpg/png, 해당공장·고객·admin)
- [ ] `chat-attachments` (20MB, jpg/png/pdf, 채팅참여자·admin)

### `FileUploader` 컴포넌트

- [ ] 드래그앤드롭 + 클릭 업로드
- [ ] 이미지 미리보기 썸네일
- [ ] 파일 삭제
- [ ] 업로드 진행률 표시
- [ ] 확장자·크기 제한 클라이언트 검사

### 고객 화면

- [ ] **내 견적 목록** (`/customer/requests`)
  - [ ] 상태별 탭 필터
  - [ ] `StatusBadge` 컴포넌트 (색상 구분)
- [ ] **견적 상세** (`/customer/requests/[id]`)
  - [ ] 입력한 폼 내용 열람
  - [ ] 업로드 사진·도면 미리보기 갤러리
  - [ ] 상태 변경 타임라인 (`status_logs` 기반)
  - [ ] 채팅 버튼
- [ ] **공장 견적서 비교** (`/customer/requests/[id]/quotes`)
  - [ ] `QuoteCard` 컴포넌트 (총액·납기·포트폴리오 링크)
  - [ ] 가격·납기 고객에게만 노출

---

## W5 — 공장 화면

**완료 기준**: 공장이 가입·포트폴리오 등록·견적서 제출 가능

### 공장 온보딩

- [ ] 추가 정보 입력 (`/factory/onboarding`)
  - [ ] 회사명·위치·소개
  - [ ] 사업자등록증 업로드 → `factory-biz-docs`
- [ ] 심사 대기 페이지 (`/factory/pending`)

### 공장 대시보드

- [ ] **홈** (`/factory`) — 진행 중 프로젝트 요약
- [ ] **포트폴리오 관리** (`/factory/portfolios`)
  - [ ] 작업 사례 등록·수정·삭제
  - [ ] 이미지 업로드 → `factory-portfolios`
- [ ] **매칭된 요청 목록** (`/factory/requests`)
  - [ ] 요청 상세 (고객 정보·폼·사진)
- [ ] **견적서 작성** (`/factory/requests/[id]/quote`)
  - [ ] 항목별 금액 입력 + 총액 자동 계산
  - [ ] 납기일 입력
  - [ ] 제출 → `factory_quotes` INSERT + 알림
- [ ] **진행 프로젝트** (`/factory/projects`)
  - [ ] 진행 사진 업로드 → `progress-photos`

---

## W6 — 관리자 화면 ★

**완료 기준**: 관리자가 견적 수령 → 검수 → 매칭 → 견적 전달 전 과정 처리 가능

> AI가 없으므로 이 화면이 소핏의 실질적 운영 두뇌.
> 화면 흐름: `UI_FLOW.md` §6 참조

### 관리자 레이아웃

- [ ] 사이드바 (미처리 건수 뱃지 포함)
- [ ] 관리자 역할 강제 미들웨어 확인

### 전체 견적 요청 목록 (`/admin/requests`)

- [ ] 상태별 탭 필터
- [ ] 컬럼: 접수일·고객명·현장명·업종·상태
- [ ] 새 요청 강조 표시

### 요청 상세 + 수기 견적 작성 (`/admin/requests/[id]`)

- [ ] 고객 폼 전체 열람
- [ ] 사진·도면 갤러리 뷰어
- [ ] 상태 변경 드롭다운 → `status_logs` INSERT
- [ ] **수기 견적 작성 영역** ← 핵심
  - [ ] 예상 비용·요청사항 텍스트 입력
  - [ ] "고객에게 전달" → status=quote_arrived + 고객 알림
- [ ] 관리자 내부 메모 필드 (비공개)
- [ ] "공장 매칭" 버튼 → `/admin/requests/[id]/match`

### 공장 매칭 (`/admin/requests/[id]/match`)

- [ ] 활성 공장 카드 목록
- [ ] 위치·카테고리 필터
- [ ] [매칭] 클릭 → `matches` INSERT + 공장 알림
- [ ] 매칭 이력 + 취소 기능

### 공장 관리 (`/admin/factories`)

- [ ] 승인 대기 탭 (사업자등록증 다운로드·열람)
- [ ] 승인/반려 처리 + 공장 알림
- [ ] 활성 공장 목록 + 정지 처리
- [ ] 공장 상세 (`/admin/factories/[id]`)

### 채팅 통합 뷰 (`/admin/chats`)

- [ ] 전체 채팅방 목록 (미답변 우선)
- [ ] 채팅방 선택 → 메시지 표시 + 전송

### 사용자 관리 (`/admin/users`)

- [ ] 고객·공장 계정 목록
- [ ] 계정 정지 기능

---

## W7 — 채팅 + 알림

**완료 기준**: 실시간 채팅 동작, 새 메시지 시 알림 뱃지 업데이트

### 채팅 시스템 (Supabase Realtime)

- [ ] `ChatRoom` 공통 컴포넌트
  - [ ] 메시지 리스트 (무한 스크롤 또는 페이지네이션)
  - [ ] 새 메시지 자동 스크롤
  - [ ] 메시지 입력창 + 전송
  - [ ] 파일 첨부 (이미지·PDF → `chat-attachments`)
  - [ ] 읽음 처리 (`read_at` UPDATE)
- [ ] Supabase Realtime 구독
  ```typescript
  supabase.channel(`room:${roomId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`
    }, handler)
    .subscribe()
  ```
- [ ] **고객 채팅** (`/customer/chat/[roomId]`)
- [ ] **공장 채팅** (`/factory/chat/[roomId]`)
- [ ] **관리자 통합 뷰** (`/admin/chats/[roomId]`)
- [ ] 견적 요청 제출 시 `customer_sofit` 채팅방 자동 생성
- [ ] 공장 매칭 시 `factory_sofit` 채팅방 자동 생성

### 웹 내 알림 시스템

- [ ] `src/lib/notifications.ts` — 알림 생성 함수
- [ ] 알림 트리거 연결 (이벤트 발생 지점마다)
  - [ ] 견적 요청 제출 → 관리자
  - [ ] 공장 매칭 → 공장
  - [ ] 견적서 제출 → 고객·관리자
  - [ ] 새 채팅 메시지 → 상대방
  - [ ] 상태 변경 → 해당 사용자
  - [ ] 공장 승인/반려 → 공장
- [ ] `NotificationBell` 컴포넌트
  - [ ] 읽지 않은 알림 카운트 (Realtime 구독)
  - [ ] 드롭다운 (최근 10개)
  - [ ] 클릭 → 페이지 이동 + `read_at` UPDATE
- [ ] 알림 전체 목록 (`/notifications`)

---

## W8 — 통합 테스트 + 배포

**완료 기준**: E2E 테스트 통과, 천일쇼파 입점, 첫 테스트 견적 1건 처리

### 기능 테스트

- [ ] **고객 E2E**: 랜딩 → 로그인 → 폼 제출 → 상태 확인 → 견적서 수신 → 채팅
- [ ] **공장 E2E**: 가입 → 심사 → 포트폴리오 → 매칭 알림 → 견적서 제출
- [ ] **관리자 E2E**: 요청 수신 → 수기 견적 → 공장 매칭 → 채팅 중계 → 상태 변경
- [ ] 모바일 테스트 (Chrome Android, Safari iOS)
- [ ] 파일 업로드·다운로드 (이미지, PDF)
- [ ] 채팅 실시간 (2개 탭 동시 접속)
- [ ] 알림 실시간 업데이트

### 보안 점검

- [ ] RLS: 타인 데이터 조회 불가 (역할별 테스트)
- [ ] `/admin` 인증 없이 접근 불가
- [ ] `NEXT_PUBLIC_` 환경변수에 `SERVICE_ROLE_KEY` 없음
- [ ] `.env.local` Git에 커밋 안 됨
- [ ] 파일 업로드 확장자·크기 제한 동작
- [ ] `factory-biz-docs` 버킷 admin 외 접근 불가

### 법무 페이지

- [ ] `/terms` 이용약관 게시 (초안)
- [ ] `/privacy` 개인정보처리방침 게시 (법적 의무)
- [ ] 회원가입 시 동의 체크박스 연동

### 천일쇼파 입점

- [ ] 공장 계정 생성 + admin에서 즉시 승인
- [ ] 포트폴리오 데이터 입력 (기존 작업 사례)
- [ ] 테스트 견적 요청 1건 → 매칭 → 견적서 → 채팅 전 과정 확인

### 배포 최종

- [ ] Vercel 프로덕션 빌드 에러 없음
- [ ] 소셜 로그인 운영 URL 콜백 등록 (카카오·네이버)
- [ ] 404·500 에러 페이지
- [ ] 기본 OG 이미지 설정

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
