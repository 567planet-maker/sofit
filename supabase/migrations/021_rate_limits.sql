-- ============================================================
-- SOFIT — 서버 액션 Rate Limiting (Postgres 고정 윈도)
-- 외부 서비스 없이 Supabase 내부에서 처리한다.
--   · rate_limits: (bucket, identity, window_start) 단위 카운터
--   · check_rate_limit(): 원자적 증가 후 허용 여부 반환
-- 서버 액션에서 service_role 클라이언트로만 호출(RPC). 클라이언트 직접 호출 차단.
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. 카운터 테이블
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text        NOT NULL,   -- 용도 키 (login_email / attach_upload / chat_send ...)
  identity     text        NOT NULL,   -- 식별자 (user_id 또는 IP 또는 email)
  window_start timestamptz NOT NULL,   -- 고정 윈도 시작 시각
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, identity, window_start)
);

-- 윈도 정리(만료 행 삭제)용 인덱스
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- RLS: 정책을 두지 않아 anon/authenticated는 접근 불가.
--      service_role(서버)만 RLS를 우회해 접근하고, 실제 증가는 아래 RPC로만 수행.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────
-- 2. 원자적 증가 + 허용 판정 함수
--    반환: true = 허용, false = 한도 초과(차단)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket         text,
  p_identity       text,
  p_max            integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public   -- SECURITY DEFINER search_path 하이재킹 방지
AS $$
DECLARE
  v_window_start timestamptz;
  v_count        integer;
BEGIN
  -- 식별자가 없으면 차단하지 않음(가용성 우선, fail-open)
  IF p_identity IS NULL OR p_identity = '' THEN
    RETURN true;
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  -- 같은 (bucket, identity)의 만료 윈도 정리 (행 누적 방지)
  DELETE FROM public.rate_limits
   WHERE bucket = p_bucket
     AND identity = p_identity
     AND window_start < v_window_start;

  INSERT INTO public.rate_limits AS rl (bucket, identity, window_start, count)
       VALUES (p_bucket, p_identity, v_window_start, 1)
  ON CONFLICT (bucket, identity, window_start)
       DO UPDATE SET count = rl.count + 1
    RETURNING rl.count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- 클라이언트(anon/authenticated)의 직접 호출 차단 — 서버(service_role)만 실행.
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- ============================================================
-- 적용 후 검증
--   1) SELECT public.check_rate_limit('test','me',2,60);  → true
--   2) 같은 줄 3회 더 실행 → 3번째부터 false (max=2 초과)
--   3) anon/authenticated 역할로 RPC 호출 시 권한 오류여야 함.
--   4) 운영 중 rate_limits 행 수는 활성 식별자 수준으로 유지(만료 자동 정리).
-- ============================================================
