-- ============================================================
-- SOFIT W5 — Factory Storage + Progress Photos + Policy Fixes
-- Supabase SQL 에디터에서 실행
-- ============================================================

-- 1. progress_photos 테이블 (공장 진행 사진)
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  factory_id  uuid NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  file_url    text NOT NULL,  -- storage path (bucket: progress-photos)
  file_name   text,
  file_size   integer,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_request_id ON public.progress_photos(request_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_factory_id ON public.progress_photos(factory_id);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_photos: 공장 본인" ON public.progress_photos FOR ALL
  USING (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()));

CREATE POLICY "progress_photos: 고객 조회" ON public.progress_photos FOR SELECT
  USING (request_id IN (
    SELECT id FROM public.quote_requests
    WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  ));

CREATE POLICY "progress_photos: admin" ON public.progress_photos FOR ALL
  USING (get_my_role() = 'admin');

-- 2. 공장이 자신의 매칭을 수락/거절할 수 있도록 UPDATE 정책 추가
CREATE POLICY "matches: 공장 수락거절" ON public.matches FOR UPDATE
  USING (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()))
  WITH CHECK (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()));

-- 3. 알림 INSERT 허용 (공장→고객, 관리자→사용자 등 서버 액션에서 필요)
CREATE POLICY "notifications: 인증 사용자 INSERT" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. chat_rooms에 customer_factory 타입 추가 (고객↔공장 직접 채팅)
ALTER TABLE public.chat_rooms
  DROP CONSTRAINT IF EXISTS chat_rooms_type_check;

ALTER TABLE public.chat_rooms
  ADD CONSTRAINT chat_rooms_type_check
  CHECK (type IN ('customer_sofit', 'factory_sofit', 'customer_factory'));

-- ============================================================
-- Storage Buckets — Supabase 대시보드에서 수동 생성 필요
-- ============================================================
-- 버킷명: factory-portfolios
--   공개: true (전체 공개)
--   최대 파일 크기: 10MB
--   허용 MIME: image/jpeg, image/png, image/webp
--
-- 버킷명: factory-biz-docs
--   공개: false (admin 전용)
--   최대 파일 크기: 20MB
--   허용 MIME: application/pdf, image/jpeg, image/png
--
-- 버킷명: progress-photos
--   공개: false
--   최대 파일 크기: 10MB
--   허용 MIME: image/jpeg, image/png, image/webp
-- ============================================================
