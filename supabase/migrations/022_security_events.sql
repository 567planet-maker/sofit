-- ============================================================
-- SOFIT — 보안 이벤트 로깅 (모니터링·탐지 토대)
-- 인증 실패·rate limit 차단·OAuth state 위조 등 보안 이벤트를 별도 추적한다.
-- 쓰기는 서버(service_role)만, 조회는 admin만. (개인정보 최소: 이메일은 마스킹해 기록)
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,        -- rate_limited / login_failed / oauth_state_mismatch ...
  identity   text,                 -- user_id / 마스킹된 email / ip 등 식별자
  ip         text,                 -- 클라이언트 IP (x-forwarded-for 첫 값)
  detail     jsonb,                -- 추가 컨텍스트 { bucket, reason, ... }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type    ON public.security_events (type, created_at DESC);

-- RLS: 조회는 admin만. 쓰기 정책은 없음 → service_role(서버)만 RLS 우회로 INSERT.
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events: admin 조회" ON public.security_events FOR SELECT
  USING (get_my_role() = 'admin');

-- ============================================================
-- 적용 후 검증
--   1) 서버(서비스 클라이언트)에서 INSERT 후 admin으로 조회되는지.
--   2) anon/일반 사용자로 SELECT 시 0건(또는 권한 거부)이어야 함.
--   3) 보관 정책: 운영 시 90일 경과 행은 주기적으로 파기 권장
--      (예: DELETE FROM security_events WHERE created_at < now() - interval '90 days').
-- ============================================================
