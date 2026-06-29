-- ============================================================
-- SOFIT — Realtime 활성화 (채팅·알림 실시간 반영)
-- postgres_changes 이벤트는 테이블이 supabase_realtime publication에
-- 등록돼야 클라이언트로 전달된다. 그동안 등록이 없어 새로고침해야만
-- 채팅/알림이 보였던 문제를 해결한다.
-- Supabase SQL 에디터에서 실행. (이미 등록돼 있어도 안전하게 동작)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 참고: Realtime은 RLS를 따른다. 구독자(고객/공장/관리자)가 해당 행을
--   SELECT할 수 있어야 이벤트를 받는다. chat_messages·notifications의
--   기존 SELECT 정책(참여자/본인)으로 충분하다.

-- 확인용:
--   SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
--   → chat_messages, notifications 가 보여야 함.
