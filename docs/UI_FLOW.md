# UI_FLOW — SOFIT 화면 흐름 설계

> 범위: Phase 0 Core MVP
> 기준: `PRD_CoreMVP.md`

---

## 1. 페이지 구조 (사이트맵)

```
/ (랜딩페이지)                 비로그인 접근 가능
├── /login                     로그인·회원가입
├── /terms                     이용약관
├── /privacy                   개인정보처리방침
├── /portfolios                공장 포트폴리오 갤러리 (전체 공개)
│    └── /portfolios/[id]      포트폴리오 상세
│
├── /customer/                 고객 전용 (role=customer)
│    ├── /customer              대시보드 (내 견적 현황)
│    ├── /customer/request      견적 요청 폼 (멀티스텝)
│    ├── /customer/requests     내 견적 목록
│    │    └── /[id]             견적 상세
│    │         └── /quotes      공장 견적서 비교
│    └── /customer/chat         채팅 목록
│         └── /[roomId]         채팅방
│
├── /factory/                  공장 전용 (role=factory)
│    ├── /factory/onboarding    최초 가입 추가 정보 입력
│    ├── /factory/pending       심사 대기 안내
│    ├── /factory               대시보드 (진행 중 요약)
│    ├── /factory/portfolios    포트폴리오 관리
│    ├── /factory/requests      매칭된 견적 요청 목록
│    │    └── /[id]             요청 상세 + 견적서 작성
│    ├── /factory/projects      진행 중 프로젝트
│    └── /factory/chat          채팅 목록
│         └── /[roomId]         채팅방
│
└── /admin/                    관리자 전용 (role=admin)
     ├── /admin                  대시보드 (미처리 건수 요약)
     ├── /admin/requests          전체 견적 요청 목록
     │    └── /[id]               요청 상세 + 수기 견적 작성
     │         └── /match         공장 매칭 화면
     ├── /admin/factories         공장 관리 (승인·활성·정지)
     │    └── /[id]               공장 상세
     ├── /admin/chats             채팅 통합 뷰
     │    └── /[roomId]           채팅방
     ├── /admin/users             사용자 관리
     └── /admin/notifications     알림 발송 이력
```

---

## 2. 공통 컴포넌트

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `Header` | 전체 | 로고, 내비게이션, 알림 벨, 유저 메뉴 |
| `NotificationBell` | Header 내 | 읽지 않은 알림 카운트 뱃지, 드롭다운 |
| `StatusBadge` | 견적 목록 | 상태별 색상 뱃지 |
| `FileUploader` | 폼, 채팅 | 드래그앤드롭, 미리보기, 진행률 |
| `ChatRoom` | 채팅 페이지 | 메시지 리스트, 입력창, 파일 첨부 |
| `PortfolioCard` | 갤러리 | 작업 사례 카드 |
| `QuoteCard` | 견적 비교 | 공장 견적서 카드 |

---

## 3. 상태(Status) 정의

### 견적 요청 상태

```
submitted     → 회색    접수됨        (고객이 폼 제출)
reviewing     → 노랑    검토중        (관리자가 폼 확인 중)
matching      → 파랑    매칭중        (관리자가 공장 매칭 중)
quote_arrived → 초록    견적서 도착   (공장 견적서 제출 완료)
negotiating   → 보라    소통중        (고객·소핏 채팅 진행)
contracted    → 진한초록 계약 완료    (공장 선택 확정)
in_progress   → 주황    시공중        (작업 진행 중)
completed     → 진한초록 완료         (납품·설치 완료)
```

### 공장 상태

```
pending    → 노랑   심사 대기
active     → 초록   활성 (매칭 가능)
rejected   → 빨강   반려
suspended  → 회색   정지
```

### 견적서 상태

```
draft      → 회색   작성 중
submitted  → 파랑   제출됨
accepted   → 초록   채택됨
rejected   → 빨강   미채택
```

---

## 4. 고객 사용자 플로우

### 4-1. 첫 방문 → 견적 요청

```
랜딩 (/)
  │
  ▼ "견적 요청하기" 클릭
로그인 (/login)
  │ 카카오·네이버 소셜 로그인
  │ (최초) 이용약관·개인정보 동의 화면
  │
  ▼ role=customer 확인
견적 요청 폼 (/customer/request)
  │
  ├─ Step 1: 현장 정보 (필수 항목)
  ├─ Step 2: 제품 정보 (선택)
  ├─ Step 3: 규격 + 도면 업로드 (선택)
  ├─ Step 4: 자재 + 사진 업로드
  └─ Step 5: 일정 + 제출
       │
       ▼ DB INSERT + 관리자 알림
제출 완료 페이지
  "접수 완료. 보통 몇 시간 내 검토됩니다."
  [내 견적 현황 보기]
```

### 4-2. 견적서 수신 → 공장 선택

```
내 견적 목록 (/customer/requests)
  │ 상태: "견적서 도착" 뱃지 확인
  ▼
견적 상세 (/customer/requests/[id])
  │
  ▼ "견적서 비교하기" 클릭
공장 견적서 비교 (/customer/requests/[id]/quotes)
  │
  ├─ 공장 A 카드 (총액·납기·포트폴리오 링크)
  ├─ 공장 B 카드
  └─ [소핏에게 문의] → 채팅방 이동
       │
       ▼ 소통 후 공장 선택
소핏에게 선택 의사 전달 (채팅)
  │
  ▼ 관리자 최종 확정
상태 → "계약 완료"
```

### 4-3. 시공 진행 확인

```
견적 상세 (/customer/requests/[id])
  │
  ├─ 진행 타임라인 (상태 변경 이력)
  ├─ 공장 업로드 진행 사진 확인
  └─ 채팅으로 진행 문의
```

---

## 5. 공장 사용자 플로우

### 5-1. 가입 → 심사 → 활성화

```
로그인 (/login)
  │ role=factory 선택 후 가입
  ▼
추가 정보 입력 (/factory/onboarding)
  │ 회사명·위치·소개·사업자등록증 업로드·포트폴리오 1개
  ▼
심사 대기 (/factory/pending)
  "관리자 심사 중입니다. 승인 후 매칭을 받을 수 있습니다."
  │
  ▼ 관리자 승인 → 알림 수신
공장 대시보드 (/factory)
```

### 5-2. 매칭 수신 → 견적서 제출

```
알림 벨 (새 매칭 알림)
  │
  ▼
매칭된 요청 목록 (/factory/requests)
  │
  ▼ 요청 클릭
요청 상세 (/factory/requests/[id])
  │ 고객 정보·폼 내용·사진 열람
  │
  ▼ "견적서 작성" 클릭
견적서 작성 (/factory/requests/[id]/quote)
  │
  ├─ 자재비·제작비·운송비·설치비·기타 입력
  ├─ 총액 자동 계산
  ├─ 납기일 입력
  └─ [제출] 클릭
       │
       ▼ DB INSERT + 관리자·고객 알림
"견적서가 제출되었습니다" 확인
```

### 5-3. 낙찰 → 시공 진행

```
상태: "계약 완료" 알림 수신
  │
  ▼
진행 프로젝트 (/factory/projects)
  │
  ├─ 일정 확인
  ├─ 진행 사진 업로드 (작업 단계별)
  └─ 소핏 채팅으로 일정·특이사항 소통
```

---

## 6. 관리자 플로우

### 6-1. 견적 요청 처리 (핵심 — AI 대신 수동)

```
관리자 대시보드 (/admin)
  │ "미처리 견적 N건" 알림
  ▼
전체 견적 요청 (/admin/requests)
  │ status="submitted" 필터
  ▼
요청 상세 (/admin/requests/[id])
  │
  ├─ 고객 폼 전체 열람
  ├─ 사진·도면 확인
  ├─ 상태 → "reviewing"으로 변경
  │
  ├─ [수기 견적 작성] ← 핵심
  │    └─ 예상 비용·요청사항 정리 → "고객에게 전달" 클릭
  │         └─ 상태 → "quote_arrived" + 고객 알림
  │
  └─ [공장 매칭] 클릭 → /admin/requests/[id]/match
```

### 6-2. 공장 매칭

```
공장 매칭 (/admin/requests/[id]/match)
  │
  ├─ 활성 공장 목록 (위치·포트폴리오 필터)
  │
  ├─ 공장 A 카드 [매칭] 클릭
  │    └─ matches INSERT + 공장 알림
  │
  └─ 매칭된 공장 목록 표시
       └─ 상태 → "matching"
```

### 6-3. 공장 심사

```
공장 관리 (/admin/factories)
  │ "승인 대기" 탭
  ▼
공장 상세 검토
  │ 사업자등록증 다운로드·열람
  │ 포트폴리오 확인
  │
  ├─ [승인] → status="active" + 공장 알림
  └─ [반려] → 사유 입력 → status="rejected" + 공장 알림
```

### 6-4. 채팅 중계

```
채팅 통합 뷰 (/admin/chats)
  │
  ├─ 왼쪽: 전체 채팅방 목록 (미답변 우선)
  │
  └─ 오른쪽: 선택된 채팅방 메시지
       │
       ├─ 고객↔소핏 채팅: 고객 질문 확인 → 답변
       └─ 공장↔소핏 채팅: 공장 문의 확인 → 답변
            └─ 필요 시 양쪽 내용 교차 확인 후 중계
```

---

## 7. 알림 흐름

```
이벤트 발생
  │
  ▼ 서버 (API Route / Server Action)
notifications 테이블 INSERT
  │
  ▼ Supabase Realtime 구독 (프론트)
NotificationBell 카운트 +1 업데이트
  │
  ▼ 벨 클릭
알림 드롭다운 목록
  │
  ▼ 알림 클릭
read_at UPDATE + link로 페이지 이동
```

---

## 8. 채팅 메시지 흐름

```
사용자 메시지 입력 + 전송
  │
  ▼ chat_messages INSERT (Supabase)
  │
  ├─ Supabase Realtime → 같은 방 구독자 실시간 수신
  │
  └─ notifications INSERT → 상대방 알림 벨 업데이트
```

---

## 9. 파일 업로드 흐름

```
사용자 파일 선택
  │
  ▼ 클라이언트 사이드 유효성 검사
  │ (확장자, 크기 제한)
  │
  ▼ Supabase Storage uploadToSignedUrl (또는 upload)
  │
  ├─ 성공: file_url 반환 → DB 저장
  └─ 실패: 에러 메시지 표시 + 재시도
```

---

## 10. 견적 요청 폼 스텝 흐름

```
Step 1 현장 정보 (필수 항목)
  │ 유효성 통과
  ▼
Step 2 제품·쇼파 정보 (선택)
  │ [다음] or [건너뛰기]
  ▼
Step 3 규격 + 도면 업로드 (선택)
  │
  ▼
Step 4 자재 + 매장 사진 업로드
  │ (사진은 1장 이상 권장)
  ▼
Step 5 일정 + 최종 확인
  │ 전체 입력 내용 요약 표시
  ▼
[제출] 클릭
  │
  ▼ quote_requests INSERT
  └─ request_files INSERT (업로드된 파일 URL들)
```

> 각 스텝은 로컬스토리지에 임시 저장 → 새로고침 시 복구
> 이전 스텝 이동 가능 (데이터 유지)
