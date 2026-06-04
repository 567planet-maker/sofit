-- ============================================================
-- SOFIT W7 — 채팅 + 알림 RLS 보완
-- Supabase SQL 에디터에서 실행
-- ============================================================

-- 1. chat_rooms SELECT 정책 수정
--    기존 정책: 공장은 factory_sofit 방만 조회 가능
--    수정: 공장이 confirmed 매칭에 연결된 customer_factory 방도 조회 가능
DROP POLICY IF EXISTS "chat_rooms: 참여자 조회" ON public.chat_rooms;

CREATE POLICY "chat_rooms: 참여자 조회" ON public.chat_rooms FOR SELECT
  USING (
    get_my_role() = 'admin'
    OR request_id IN (
      SELECT id FROM public.quote_requests
      WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
    OR match_id IN (
      SELECT id FROM public.matches
      WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
    )
  );

-- 2a. chat_rooms INSERT — 고객이 customer_sofit 방 생성 허용 (견적 제출 시 자동 생성)
CREATE POLICY "chat_rooms: 고객 customer_sofit 생성" ON public.chat_rooms FOR INSERT
  WITH CHECK (
    type = 'customer_sofit'
    AND request_id IN (
      SELECT id FROM public.quote_requests
      WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
  );

-- 2b. chat_rooms INSERT — 공장이 customer_factory 방 생성 허용 (매칭 수락 시 자동 생성)
CREATE POLICY "chat_rooms: 공장 customer_factory 생성" ON public.chat_rooms FOR INSERT
  WITH CHECK (
    type = 'customer_factory'
    AND match_id IN (
      SELECT id FROM public.matches
      WHERE factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid())
      AND status = 'confirmed'
    )
  );

-- 3. chat_messages INSERT 보안 강화: 발신자이면서 방 참여자여야 함
DROP POLICY IF EXISTS "chat_messages: 본인 INSERT" ON public.chat_messages;

CREATE POLICY "chat_messages: 본인 INSERT" ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND room_id IN (SELECT id FROM public.chat_rooms)
  );

-- 4. chat_messages UPDATE — read_at 갱신 허용 (방 참여자)
CREATE POLICY "chat_messages: 참여자 읽음 처리" ON public.chat_messages FOR UPDATE
  USING (room_id IN (SELECT id FROM public.chat_rooms))
  WITH CHECK (room_id IN (SELECT id FROM public.chat_rooms));

-- ============================================================
-- Storage Bucket: chat-attachments
-- Supabase 대시보드 > Storage > New Bucket 에서 수동 생성
-- ============================================================
--   버킷명: chat-attachments
--   공개: false
--   최대 파일 크기: 20MB
--   허용 MIME: image/jpeg, image/png, image/webp, application/pdf
--
-- 아래 SQL은 버킷 생성 후 실행
-- ============================================================

-- Storage RLS: chat-attachments
-- (버킷 생성 후 Storage > Policies 탭에서 적용 또는 아래 SQL 실행)

CREATE POLICY "chat-attachments: 참여자 업로드"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "chat-attachments: 참여자 조회"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "chat-attachments: admin 삭제"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments'
    AND get_my_role() = 'admin'
  );
