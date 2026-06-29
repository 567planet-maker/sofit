-- ============================================================
-- SOFIT — 견적 다분야(인테리어 전체) 확장 (Phase 1)
-- 설계안 G-2 + 개발순서 보정 #1·#2·#3 반영.
-- Supabase SQL 에디터에서 전체 실행.
--
-- 구조: quote_requests(부모/공통) + quote_request_items(분야 N개)
--       + quote_request_attachments(첨부) + quote_request_revisions(이력)
-- 분야별 상세는 items.details(jsonb)에 저장 → 분야 추가 시 스키마 변경 0.
--
-- ⚠️ 기존 쇼파 플랫 컬럼은 DROP하지 않는다 (Phase 6 무손실 이관 후 제거).
-- ============================================================

-- ──────────────────────────────────────────
-- 1. quote_requests 재정비 (부모/공통)
-- ──────────────────────────────────────────

-- 1-1. status에 'draft' 추가 (보정 #1: 기존 8단계 유지, 교체 아님)
ALTER TABLE public.quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN (
    'draft',
    'submitted', 'reviewing', 'matching', 'quote_arrived',
    'negotiating', 'contracted', 'in_progress', 'completed'
  ));

-- 1-2. 신규 행 기본값을 draft로 (draft-first). 레거시 submitQuoteRequest는
--      status를 명시적으로 'submitted'로 넣으므로 영향 없음.
ALTER TABLE public.quote_requests
  ALTER COLUMN status SET DEFAULT 'draft';

-- 1-3. draft row가 빈 상태로 생성 가능하도록 레거시 필수 컬럼의 NOT NULL 해제.
--      (신규 흐름은 아래 신규 공통 컬럼을 사용. 레거시 컬럼은 Phase 6까지 보존)
ALTER TABLE public.quote_requests
  ALTER COLUMN company_name   DROP NOT NULL,
  ALTER COLUMN contact        DROP NOT NULL,
  ALTER COLUMN site_name      DROP NOT NULL,
  ALTER COLUMN address        DROP NOT NULL,
  ALTER COLUMN site_manager   DROP NOT NULL,
  ALTER COLUMN available_time DROP NOT NULL;

-- 1-4. 신규 공통 컬럼 (설계안 C-1~C-3)
--      address는 기존 text 컬럼과 충돌하므로 site_address(jsonb)로 추가.
--      Phase 6에서 구 address text → site_address 이관 후 구 컬럼 제거.
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS site_address       jsonb,          -- { zipcode, road, detail, lat, lng }
  ADD COLUMN IF NOT EXISTS contact_name       text,
  ADD COLUMN IF NOT EXISTS contact_phone      text,
  ADD COLUMN IF NOT EXISTS building_type      text,           -- apartment/villa/house/retail/office/lodging/etc
  ADD COLUMN IF NOT EXISTS space_status       text,           -- new/full_remodel/partial_remodel/repair
  ADD COLUMN IF NOT EXISTS area_m2            numeric(10,2),  -- 내부 ㎡ 통일 (UI는 평 토글)
  ADD COLUMN IF NOT EXISTS total_floors       integer,
  ADD COLUMN IF NOT EXISTS is_occupied        text,           -- vacant/occupied_residence/occupied_business
  ADD COLUMN IF NOT EXISTS desired_start_date date,
  ADD COLUMN IF NOT EXISTS desired_end_date   date,
  ADD COLUMN IF NOT EXISTS budget_range       text,           -- under_10m/10m_30m/30m_50m/50m_100m/over_100m
  ADD COLUMN IF NOT EXISTS special_requests   text,
  ADD COLUMN IF NOT EXISTS submitted_at       timestamptz;

-- 참고: business_type, floor, has_elevator, has_parking, available_time,
--       needs_measurement, site_name 은 기존 컬럼을 그대로 재사용한다.

-- ──────────────────────────────────────────
-- 2. quote_request_items (분야별 항목: 1요청 N분야)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_request_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  category       text NOT NULL,                  -- FIELD_SCHEMAS의 category key
  schema_version integer NOT NULL DEFAULT 1,     -- 필드 변경돼도 과거 데이터 해석 가능
  details        jsonb NOT NULL DEFAULT '{}',    -- 분야별 입력값 (설계안 D)
  status         text NOT NULL DEFAULT 'draft',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, category)                  -- 같은 요청에 같은 분야 중복 방지
);

CREATE INDEX IF NOT EXISTS idx_qri_request  ON public.quote_request_items (request_id);
CREATE INDEX IF NOT EXISTS idx_qri_category ON public.quote_request_items (category);
CREATE INDEX IF NOT EXISTS idx_qri_details  ON public.quote_request_items USING gin (details);

-- ──────────────────────────────────────────
-- 3. quote_request_attachments (첨부: 공통=item_id NULL / 분야별=item_id)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_request_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  item_id      uuid REFERENCES public.quote_request_items(id) ON DELETE CASCADE, -- NULL = 공통 첨부
  kind         text NOT NULL,        -- site_photo/style_ref/drawing/sketch/prev_quote/etc
  storage_path text NOT NULL,        -- Supabase Storage 경로 (버킷: request-images / request-documents 재사용)
  file_name    text,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qra_request ON public.quote_request_attachments (request_id);
CREATE INDEX IF NOT EXISTS idx_qra_item    ON public.quote_request_attachments (item_id);

-- ──────────────────────────────────────────
-- 4. quote_request_revisions (제출/주요 변경 스냅샷, 운영용)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_request_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  snapshot    jsonb NOT NULL,                -- 시점 전체 스냅샷 (request + items + attachments)
  reason      text,                          -- submitted/customer_edit/admin_edit
  created_by  uuid REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qrr_request ON public.quote_request_revisions (request_id);

-- ──────────────────────────────────────────
-- 5. 매칭/견적서를 분야(item) 단위로 연결 (Phase 7에서 활용)
-- ──────────────────────────────────────────
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.quote_request_items(id);
ALTER TABLE public.factory_quotes
  ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.quote_request_items(id);

CREATE INDEX IF NOT EXISTS idx_matches_item_id        ON public.matches (item_id);
CREATE INDEX IF NOT EXISTS idx_factory_quotes_item_id ON public.factory_quotes (item_id);

-- ──────────────────────────────────────────
-- 6. updated_at 자동 갱신 트리거 (items)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qri_updated_at ON public.quote_request_items;
CREATE TRIGGER trg_qri_updated_at
  BEFORE UPDATE ON public.quote_request_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ──────────────────────────────────────────
-- 7. RLS 활성화 (설계안 누락분 — 001 패턴 이식)
-- ──────────────────────────────────────────
ALTER TABLE public.quote_request_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_request_revisions   ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────
-- 8. RLS 정책
-- ──────────────────────────────────────────

-- 8-1. quote_request_items
--   고객 본인: 자신의 요청에 속한 item 전체 권한 (draft 작성·수정·삭제)
CREATE POLICY "qri: 고객 본인" ON public.quote_request_items FOR ALL
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ))
  WITH CHECK (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));

--   공장: 자신에게 매칭된 요청의 item 조회 (001의 SECURITY DEFINER 헬퍼 재사용)
CREATE POLICY "qri: 공장 매칭 조회" ON public.quote_request_items FOR SELECT
  USING (request_id IN (SELECT public.get_factory_matched_request_ids()));

--   admin 전체
CREATE POLICY "qri: admin" ON public.quote_request_items FOR ALL
  USING (get_my_role() = 'admin');

-- 8-2. quote_request_attachments (부모 request 권한을 따라감)
CREATE POLICY "qra: 고객 본인" ON public.quote_request_attachments FOR ALL
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ))
  WITH CHECK (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));

CREATE POLICY "qra: 공장 매칭 조회" ON public.quote_request_attachments FOR SELECT
  USING (request_id IN (SELECT public.get_factory_matched_request_ids()));

CREATE POLICY "qra: admin" ON public.quote_request_attachments FOR ALL
  USING (get_my_role() = 'admin');

-- 8-3. quote_request_revisions (고객 본인 조회 + admin 전체)
CREATE POLICY "qrr: 고객 본인 조회" ON public.quote_request_revisions FOR SELECT
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));

CREATE POLICY "qrr: admin" ON public.quote_request_revisions FOR ALL
  USING (get_my_role() = 'admin');

-- ============================================================
-- Storage 버킷 — 신규 생성 불필요.
--   기존 'request-images'(이미지) / 'request-documents'(도면) 재사용.
--   attachments.storage_path 에 버킷 내 경로 저장, kind로 용도 구분.
-- ============================================================

-- ============================================================
-- 적용 후 검증 (Phase 1 DoD)
--   1) draft INSERT 가능:
--        INSERT INTO quote_requests (customer_id, status) VALUES ('<내 customer_id>','draft');
--   2) IDOR: 다른 사용자로 위 row SELECT 시 0건이어야 함 (RLS).
--   3) anon key로 quote_request_items 전체 조회 시 0건이어야 함.
-- ============================================================
