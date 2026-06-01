-- ============================================================
-- SOFIT Phase 0 — Initial Schema
-- Supabase SQL 에디터에서 전체 실행
-- ============================================================

-- ──────────────────────────────────────────
-- 1. 테이블 생성
-- ──────────────────────────────────────────

CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  phone      text,
  role       text NOT NULL DEFAULT 'customer'
             CHECK (role IN ('customer', 'factory', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kakao_id   text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.factories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  biz_reg_url     text,
  location        text,
  description     text,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  rating_avg      numeric(3,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.factory_portfolios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id   uuid NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  image_url    text NOT NULL,
  description  text,
  category     text CHECK (category IN ('sofa', 'builtin', 'other')),
  completed_at date,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.quote_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customers(id),

  -- 현장 정보 (필수)
  company_name    text NOT NULL,
  contact         text NOT NULL,
  site_name       text NOT NULL,
  address         text NOT NULL,
  site_manager    text NOT NULL,
  available_time  text NOT NULL,

  -- 현장 정보 (선택)
  business_type   text,
  has_parking     boolean,
  floor           integer,
  has_elevator    boolean,

  -- 제품 정보 (선택)
  sofa_type       text,
  sofa_count      integer,
  seat_count      integer,
  backrest_height text,
  has_armrest     boolean,
  cushion_type    text,
  frame_structure text,
  flame_retardant boolean,
  waterproof      boolean,

  -- 규격 (선택, cm 단위)
  total_length    numeric(8,1),
  total_width     numeric(8,1),
  total_height    numeric(8,1),
  seat_height     numeric(8,1),
  seat_depth      numeric(8,1),
  wall_length     numeric(8,1),
  corner_angle    integer,

  -- 자재 (선택)
  fabric_type     text,
  inner_material  text,
  frame_material  text,
  color_code      text,

  -- 공정·설치·일정 (선택)
  needs_measurement boolean,
  install_hours     integer,
  measurement_date  date,
  production_start  date,
  production_end    date,
  delivery_date     date,
  install_date      date,
  as_available_date date,

  -- 상태
  status          text DEFAULT 'submitted'
                  CHECK (status IN (
                    'submitted', 'reviewing', 'matching', 'quote_arrived',
                    'negotiating', 'contracted', 'in_progress', 'completed'
                  )),
  admin_note      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE public.request_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  file_type   text NOT NULL CHECK (file_type IN ('image', 'document', 'sample')),
  file_url    text NOT NULL,
  file_name   text,
  file_size   integer,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.matches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id),
  factory_id  uuid NOT NULL REFERENCES public.factories(id),
  status      text DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (request_id, factory_id)
);

CREATE TABLE public.factory_quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
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

CREATE TABLE public.chat_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id),
  match_id    uuid REFERENCES public.matches(id),
  type        text NOT NULL CHECK (type IN ('customer_sofit', 'factory_sofit')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (match_id, type)
);

CREATE TABLE public.chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES public.chat_rooms(id),
  sender_id   uuid NOT NULL REFERENCES public.users(id),
  content     text,
  file_url    text,
  file_name   text,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.status_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id),
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid NOT NULL REFERENCES public.users(id),
  note        text,
  created_at  timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────
-- 2. 인덱스
-- ──────────────────────────────────────────

CREATE INDEX idx_quote_requests_customer_id ON public.quote_requests(customer_id);
CREATE INDEX idx_quote_requests_status      ON public.quote_requests(status);
CREATE INDEX idx_matches_request_id         ON public.matches(request_id);
CREATE INDEX idx_matches_factory_id         ON public.matches(factory_id);
CREATE INDEX idx_chat_messages_room_id      ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at   ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_notifications_user_id      ON public.notifications(user_id, read_at);
CREATE INDEX idx_status_logs_request_id     ON public.status_logs(request_id);

-- ──────────────────────────────────────────
-- 3. 신규 가입 트리거
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');

  INSERT INTO public.customers (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ──────────────────────────────────────────
-- 4. 헬퍼 함수
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_factory_id()
RETURNS uuid AS $$
  SELECT id FROM public.factories
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ──────────────────────────────────────────
-- 5. RLS 활성화
-- ──────────────────────────────────────────

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_quotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs        ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────
-- 6. RLS 정책
-- ──────────────────────────────────────────

-- users
CREATE POLICY "users: 본인 조회"       ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users: admin 전체 조회" ON public.users FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "users: 본인 수정"       ON public.users FOR UPDATE USING (id = auth.uid());

-- customers
CREATE POLICY "customers: 본인 조회"   ON public.customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "customers: admin 조회"  ON public.customers FOR SELECT USING (get_my_role() = 'admin');

-- factories
CREATE POLICY "factories: 활성 공개"   ON public.factories FOR SELECT USING (status = 'active');
CREATE POLICY "factories: 본인 조회"   ON public.factories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "factories: 본인 INSERT" ON public.factories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "factories: 본인 수정"   ON public.factories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "factories: admin"       ON public.factories FOR ALL USING (get_my_role() = 'admin');

-- factory_portfolios
CREATE POLICY "portfolios: 전체 공개"  ON public.factory_portfolios FOR SELECT USING (true);
CREATE POLICY "portfolios: 공장 수정"  ON public.factory_portfolios FOR ALL
  USING (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()));
CREATE POLICY "portfolios: admin"      ON public.factory_portfolios FOR ALL USING (get_my_role() = 'admin');

-- quote_requests
CREATE POLICY "requests: 고객 본인 조회" ON public.quote_requests FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));
-- SECURITY DEFINER 함수로 matches↔quote_requests 순환 참조 방지
CREATE OR REPLACE FUNCTION public.get_factory_matched_request_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT m.request_id
  FROM public.matches m
  JOIN public.factories f ON m.factory_id = f.id
  WHERE f.user_id = auth.uid();
$$;

CREATE POLICY "requests: 공장 매칭된 조회" ON public.quote_requests FOR SELECT
  USING (id IN (SELECT get_factory_matched_request_ids()));
CREATE POLICY "requests: admin 전체" ON public.quote_requests FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "requests: 고객 INSERT" ON public.quote_requests FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- request_files
CREATE POLICY "files: 고객 본인 조회" ON public.request_files FOR SELECT
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));
CREATE POLICY "files: 공장 조회" ON public.request_files FOR SELECT
  USING (request_id IN (
    SELECT request_id FROM public.matches
    WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
  ));
CREATE POLICY "files: admin 전체" ON public.request_files FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "files: 고객 INSERT" ON public.request_files FOR INSERT
  WITH CHECK (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));

-- matches
CREATE POLICY "matches: 관리자"   ON public.matches FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "matches: 고객 조회" ON public.matches FOR SELECT
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));
CREATE POLICY "matches: 공장 조회" ON public.matches FOR SELECT
  USING (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()));

-- factory_quotes
CREATE POLICY "quotes: 관리자"    ON public.factory_quotes FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "quotes: 공장 본인" ON public.factory_quotes FOR ALL
  USING (match_id IN (
    SELECT id FROM public.matches
    WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
  ));
CREATE POLICY "quotes: 고객 조회" ON public.factory_quotes FOR SELECT
  USING (
    status = 'submitted'
    AND match_id IN (
      SELECT m.id FROM public.matches m
      JOIN public.quote_requests r ON m.request_id = r.id
      JOIN public.customers c ON r.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- chat_rooms
CREATE POLICY "chat_rooms: 참여자 조회" ON public.chat_rooms FOR SELECT
  USING (
    get_my_role() = 'admin'
    OR request_id IN (
      SELECT id FROM public.quote_requests
      WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
    OR (
      type = 'factory_sofit'
      AND match_id IN (
        SELECT id FROM public.matches
        WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
      )
    )
  );
CREATE POLICY "chat_rooms: admin INSERT" ON public.chat_rooms FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- chat_messages
CREATE POLICY "chat_messages: 참여자 조회" ON public.chat_messages FOR SELECT
  USING (room_id IN (SELECT id FROM public.chat_rooms));
CREATE POLICY "chat_messages: 본인 INSERT" ON public.chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- notifications
CREATE POLICY "notifications: 본인 조회"    ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications: 본인 읽음 처리" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- status_logs
CREATE POLICY "status_logs: admin 전체"   ON public.status_logs FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "status_logs: 고객 조회"    ON public.status_logs FOR SELECT
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));
CREATE POLICY "status_logs: 공장 조회"    ON public.status_logs FOR SELECT
  USING (request_id IN (
    SELECT request_id FROM public.matches
    WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
  ));
