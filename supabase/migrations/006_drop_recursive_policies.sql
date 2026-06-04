-- ============================================================
-- 005에서 추가한 UPDATE 정책들이 infinite recursion을 유발
-- (quote_requests 정책 → matches 조회 → matches 정책 → quote_requests 조회)
-- 서버 액션에서 service_role 클라이언트로 전환했으므로 이 정책들은 불필요
-- ============================================================

DROP POLICY IF EXISTS "requests: 공장 상태 업데이트" ON public.quote_requests;
DROP POLICY IF EXISTS "requests: 고객 상태 업데이트" ON public.quote_requests;
DROP POLICY IF EXISTS "quotes: 고객 수락"            ON public.factory_quotes;
