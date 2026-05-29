# DB_SCHEMA — SOFIT 데이터베이스 설계

> 플랫폼: Supabase (PostgreSQL)
> 범위: Phase 0 Core MVP
> RLS 정책 포함

---

## 테이블 관계도 (텍스트)

```
users
 ├── customers (1:1)
 │    └── quote_requests (1:N)
 │         ├── request_files (1:N)
 │         ├── matches (1:N)
 │         │    ├── factory_quotes (1:N)
 │         │    └── chat_rooms (1:N)
 │         │         └── chat_messages (1:N)
 │         └── status_logs (1:N)
 └── factories (1:1)
      └── factory_portfolios (1:N)

notifications (users 1:N)
```

---

## 테이블 정의

### `users` — 공통 사용자

```sql
CREATE TABLE users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  phone      text,
  role       text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | Supabase auth.users 연동 |
| role | text | customer (기본값) / admin — 제작업체 여부는 `factories` 테이블로 판별 |

**트리거**: 소셜 로그인 완료 시 `auth.users` INSERT → `users` 자동 INSERT

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 모든 신규 가입자는 customer로 시작
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');

  -- customers 행 자동 생성 (견적 요청 바로 가능)
  INSERT INTO public.customers (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

### `customers` — 고객 프로필

```sql
CREATE TABLE customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kakao_id   text,
  created_at timestamptz DEFAULT now()
);
```

---

### `factories` — 공장 프로필

```sql
CREATE TABLE factories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  biz_reg_url     text,
  location        text,
  description     text,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  rating_avg      numeric(3,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
```

| status | 의미 |
|--------|------|
| pending | 가입 신청, 관리자 심사 대기 |
| active | 승인 완료, 매칭 가능 |
| rejected | 심사 반려 |
| suspended | 운영 정지 |

---

### `factory_portfolios` — 포트폴리오

```sql
CREATE TABLE factory_portfolios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id   uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  image_url    text NOT NULL,
  description  text,
  category     text CHECK (category IN ('sofa', 'builtin', 'other')),
  completed_at date,
  created_at   timestamptz DEFAULT now()
);
```

---

### `quote_requests` — 고객 견적 요청

```sql
CREATE TABLE quote_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id),

  -- ① 현장 정보 (필수)
  company_name    text NOT NULL,
  contact         text NOT NULL,
  site_name       text NOT NULL,
  address         text NOT NULL,
  site_manager    text NOT NULL,
  available_time  text NOT NULL,

  -- ① 현장 정보 (선택)
  business_type   text,
  has_parking     boolean,
  floor           integer,
  has_elevator    boolean,

  -- ② 제품 정보 (선택)
  sofa_type       text,
  sofa_count      integer,
  seat_count      integer,
  backrest_height text,
  has_armrest     boolean,
  cushion_type    text,
  frame_structure text,
  flame_retardant boolean,
  waterproof      boolean,

  -- ③ 규격 (선택, cm 단위)
  total_length    numeric(8,1),
  total_width     numeric(8,1),
  total_height    numeric(8,1),
  seat_height     numeric(8,1),
  seat_depth      numeric(8,1),
  wall_length     numeric(8,1),
  corner_angle    integer,

  -- ④ 자재 (선택)
  fabric_type     text,
  inner_material  text,
  frame_material  text,
  color_code      text,

  -- ⑤⑥⑦ 공정·설치·일정 (선택)
  needs_measurement boolean,
  install_hours     integer,
  measurement_date  date,
  production_start  date,
  production_end    date,
  delivery_date     date,
  install_date      date,
  as_available_date date,

  -- 상태 및 메타
  status          text DEFAULT 'submitted'
                  CHECK (status IN (
                    'submitted',    -- 접수됨
                    'reviewing',    -- 관리자 검토중
                    'matching',     -- 공장 매칭중
                    'quote_arrived',-- 견적서 도착
                    'negotiating',  -- 소통중
                    'contracted',   -- 계약 완료
                    'in_progress',  -- 시공중
                    'completed'     -- 완료
                  )),
  admin_note      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

---

### `request_files` — 견적 요청 첨부 파일

```sql
CREATE TABLE request_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  file_type   text NOT NULL CHECK (file_type IN ('image', 'document', 'sample')),
  file_url    text NOT NULL,
  file_name   text,
  file_size   integer,
  created_at  timestamptz DEFAULT now()
);
```

---

### `matches` — 관리자 수동 매칭

```sql
CREATE TABLE matches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES quote_requests(id),
  factory_id  uuid NOT NULL REFERENCES factories(id),
  status      text DEFAULT 'pending'
              CHECK (status IN (
                'pending',    -- 배포됨, 공장이 검토 중
                'accepted',   -- 공장이 수락 (견적서 작성 가능)
                'declined',   -- 공장이 거절
                'confirmed',  -- 고객이 최종 선택 (매칭 확정)
                'cancelled'   -- 취소
              )),
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (request_id, factory_id)
);
```

---

### `factory_quotes` — 공장 수정 견적서

```sql
CREATE TABLE factory_quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  material_cost   numeric(12,0) DEFAULT 0,
  labor_cost      numeric(12,0) DEFAULT 0,
  delivery_cost   numeric(12,0) DEFAULT 0,
  install_cost    numeric(12,0) DEFAULT 0,
  demolition_cost numeric(12,0) DEFAULT 0,
  extra_cost      numeric(12,0) DEFAULT 0,
  margin          numeric(12,0) DEFAULT 0,
  total_cost      numeric(12,0) GENERATED ALWAYS AS (
                    material_cost + labor_cost + delivery_cost +
                    install_cost + demolition_cost + extra_cost + margin
                  ) STORED,
  delivery_days   integer,
  version         integer DEFAULT 1,
  note            text,
  status          text DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  created_at      timestamptz DEFAULT now()
);
```

---

### `chat_rooms` — 채팅방

```sql
CREATE TABLE chat_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES quote_requests(id),
  match_id    uuid REFERENCES matches(id),
  type        text NOT NULL CHECK (type IN (
                'customer_sofit',    -- 매칭 전 고객↔소핏 (문의·안내)
                'customer_factory'   -- 매칭 확정 후 고객↔공장 직접 채팅
              )),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (match_id, type)
);
```

> `customer_sofit`: 견적 제출 시 자동 생성 (매칭 전 고객 문의용)
> `customer_factory`: matches.status = 'confirmed' 시 자동 생성 (직접 소통용, match_id 필수)

---

### `chat_messages` — 채팅 메시지

```sql
CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES chat_rooms(id),
  sender_id   uuid NOT NULL REFERENCES users(id),
  content     text,
  file_url    text,
  file_name   text,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now(),

  CHECK (
    content IS NOT NULL
    OR file_url IS NOT NULL
  )
);
```

> `content`와 `file_url` 둘 다 NULL일 수 없도록 CHECK 추가 권장
> 메시지 삭제 기능 없음 (분쟁 증거 보존)    

---

### `notifications` — 웹 내 알림

```sql
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
```

| type 값 | 대상 | 발생 시점 |
|---------|------|-----------|
| new_request | admin | 고객 견적 요청 제출 |
| factory_distributed | factory | 관리자가 공장에 요청 배포 |
| quote_arrived | customer | 공장이 견적서 직접 제출 |
| match_confirmed | factory + customer | 최종 매칭 확정 (고객 선택 완료) |
| match_declined | factory | 미채택 공장 알림 |
| new_message | 채팅 상대방 | 새 채팅 메시지 |
| status_changed | 관련 사용자 | 견적 상태 변경 |
| factory_approved | factory | 관리자 승인 |
| factory_rejected | factory | 관리자 반려 |

---

### `status_logs` — 상태 변경 이력

```sql
CREATE TABLE status_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES quote_requests(id),
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid NOT NULL REFERENCES users(id),
  note        text,
  created_at  timestamptz DEFAULT now()
);
```

---

## RLS 정책

### 활성화 (전체 테이블)

```sql
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_quotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs        ENABLE ROW LEVEL SECURITY;
```

### 역할 확인 헬퍼 함수

```sql
-- 계정 role 반환 (customer / admin)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 제작업체 활성 여부 반환 (factories 테이블 기준)
-- role='customer'여도 factories 행이 있으면 제작업체 기능 사용 가능
CREATE OR REPLACE FUNCTION get_my_factory_id()
RETURNS uuid AS $$
  SELECT id FROM public.factories
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

### `users` RLS

```sql
-- 본인 행 조회
CREATE POLICY "users: 본인 조회" ON users
  FOR SELECT USING (id = auth.uid());

-- 관리자 전체 조회
CREATE POLICY "users: admin 전체 조회" ON users
  FOR SELECT USING (get_my_role() = 'admin');

-- 본인 정보 수정
CREATE POLICY "users: 본인 수정" ON users
  FOR UPDATE USING (id = auth.uid());
```

---

### `quote_requests` RLS

```sql
-- 고객: 본인 요청만
CREATE POLICY "requests: 고객 본인 조회" ON quote_requests
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- 공장: 매칭된 요청만
CREATE POLICY "requests: 공장 매칭된 조회" ON quote_requests
  FOR SELECT USING (
    id IN (
      SELECT request_id FROM matches
      WHERE factory_id IN (SELECT id FROM factories WHERE user_id = auth.uid())
    )
  );

-- 관리자: 전체
CREATE POLICY "requests: admin 전체" ON quote_requests
  FOR ALL USING (get_my_role() = 'admin');

-- 고객: INSERT (본인 customer_id)
CREATE POLICY "requests: 고객 INSERT" ON quote_requests
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );
```

---

### `factory_portfolios` RLS

```sql
-- 전체 공개 (비로그인 포함)
CREATE POLICY "portfolios: 전체 공개" ON factory_portfolios
  FOR SELECT USING (true);

-- 공장 본인만 수정
CREATE POLICY "portfolios: 공장 수정" ON factory_portfolios
  FOR ALL USING (
    factory_id IN (SELECT id FROM factories WHERE user_id = auth.uid())
  );

-- 관리자
CREATE POLICY "portfolios: admin" ON factory_portfolios
  FOR ALL USING (get_my_role() = 'admin');
```

---

### `factories` RLS

```sql
-- 활성 공장 프로필: 전체 공개
CREATE POLICY "factories: 활성 공개" ON factories
  FOR SELECT USING (status = 'active');

-- 본인 공장: 전체 조회 (status 무관)
CREATE POLICY "factories: 본인 조회" ON factories
  FOR SELECT USING (user_id = auth.uid());

-- 제작업체 신청: 로그인한 고객이면 누구나 가능 (본인 user_id만)
CREATE POLICY "factories: 본인 INSERT" ON factories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 본인 수정
CREATE POLICY "factories: 본인 수정" ON factories
  FOR UPDATE USING (user_id = auth.uid());

-- 관리자
CREATE POLICY "factories: admin" ON factories
  FOR ALL USING (get_my_role() = 'admin');
```

---

### `chat_rooms` / `chat_messages` RLS

```sql
-- 채팅방: 고객(본인 요청) + 공장(confirmed 매칭) + 관리자(전체)
CREATE POLICY "chat_rooms: 참여자 조회" ON chat_rooms
  FOR SELECT USING (
    get_my_role() = 'admin'
    OR (
      -- 고객: 본인 요청의 모든 채팅방 (customer_sofit + customer_factory)
      request_id IN (
        SELECT id FROM quote_requests
        WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
      )
    )
    OR (
      -- 공장: confirmed 매칭의 customer_factory 채팅방만
      type = 'customer_factory'
      AND match_id IN (
        SELECT id FROM matches
        WHERE factory_id IN (SELECT id FROM factories WHERE user_id = auth.uid())
          AND status = 'confirmed'
      )
    )
  );

-- 메시지: 채팅방 접근 권한 있는 사용자
CREATE POLICY "chat_messages: 참여자 조회" ON chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM chat_rooms  -- 위 chat_rooms 정책 통해 필터됨
    )
  );

-- 메시지 INSERT: 본인만
CREATE POLICY "chat_messages: 본인 INSERT" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 메시지 DELETE: 없음 (보존 정책)
```

---

### `notifications` RLS

```sql
-- 본인 알림만 조회
CREATE POLICY "notifications: 본인 조회" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 읽음 처리: 본인만 UPDATE
CREATE POLICY "notifications: 본인 읽음 처리" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- INSERT: service_role만 (서버에서만 생성)
```

---

### `matches` / `factory_quotes` RLS

```sql
-- matches: 관리자 전체 / 고객 본인 요청 / 공장 본인 매칭
CREATE POLICY "matches: 관리자" ON matches FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "matches: 고객 조회" ON matches FOR SELECT USING (
  request_id IN (
    SELECT id FROM quote_requests
    WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  )
);
CREATE POLICY "matches: 공장 조회" ON matches FOR SELECT USING (
  factory_id IN (SELECT id FROM factories WHERE user_id = auth.uid())
);

-- factory_quotes: 관리자 전체 / 공장 본인 / 고객 status=submitted 이후
CREATE POLICY "quotes: 관리자" ON factory_quotes FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "quotes: 공장 본인" ON factory_quotes FOR ALL USING (
  match_id IN (
    SELECT id FROM matches
    WHERE factory_id IN (SELECT id FROM factories WHERE user_id = auth.uid())
  )
);
CREATE POLICY "quotes: 고객 조회" ON factory_quotes FOR SELECT USING (
  status = 'submitted'
  AND match_id IN (
    SELECT m.id FROM matches m
    JOIN quote_requests r ON m.request_id = r.id
    JOIN customers c ON r.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);
```

---

## Supabase Storage 버킷

| 버킷명 | 접근 정책 | 최대 크기 | 허용 확장자 |
|--------|-----------|-----------|-------------|
| `request-images` | 업로더·매칭 공장·admin | 10MB | jpg, jpeg, png, webp |
| `request-documents` | 업로더·매칭 공장·admin | 20MB | pdf, dwg, dxf, jpg, png |
| `factory-portfolios` | **전체 공개** | 10MB | jpg, jpeg, png, webp |
| `factory-biz-docs` | **admin 전용** | 20MB | pdf, jpg, png |
| `progress-photos` | 해당 공장·고객·admin | 10MB | jpg, jpeg, png, webp |
| `chat-attachments` | 채팅방 참여자·admin | 20MB | jpg, png, pdf |

---

## 인덱스 (성능)

```sql
CREATE INDEX idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_matches_request_id ON matches(request_id);
CREATE INDEX idx_matches_factory_id ON matches(factory_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, read_at);
CREATE INDEX idx_status_logs_request_id ON status_logs(request_id);
```

---

## Phase 0.5 이후 추가 테이블 (참고)

```
payments       -- 토스페이먼츠 결제 단계별 (Phase 0.5)
settlements    -- 공장 정산 내역 (Phase 0.5)
as_deposits    -- AS 보증금 (Phase 0.5)
reviews        -- 리뷰·평점 (Phase 0.5)
material_prices -- 자재 단가 DB (Phase 1)
ai_estimates   -- AI 가견적 결과 (Phase 1)
```
