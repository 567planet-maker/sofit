-- ============================================================
-- SOFIT W8 — 견적서 버전 관리 (수정 견적 시스템)
-- Supabase SQL 에디터에서 실행
-- ============================================================

-- 1. factory_quotes.status에 'superseded' 추가
--    (이전 버전 견적서 표시용 — 최신 버전은 항상 'submitted')
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT tc.constraint_name INTO v_constraint
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
  WHERE tc.table_name   = 'factory_quotes'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%status%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.factory_quotes DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END $$;

ALTER TABLE public.factory_quotes
  ADD CONSTRAINT factory_quotes_status_check
  CHECK (status IN ('draft', 'submitted', 'superseded', 'accepted', 'rejected'));

-- 2. is_latest 플래그 추가 (최신 버전 빠른 조회용)
--    draft는 항상 false, 최신 submitted만 true
ALTER TABLE public.factory_quotes
  ADD COLUMN IF NOT EXISTS is_latest boolean NOT NULL DEFAULT true;

-- 3. 기존 데이터 정합성 맞추기
--    match_id별 최신 submitted(version 최대값)만 is_latest=true, 나머지 false
WITH latest_per_match AS (
  SELECT DISTINCT ON (match_id) id
  FROM  public.factory_quotes
  WHERE status = 'submitted'
  ORDER BY match_id, version DESC
)
UPDATE public.factory_quotes
SET    is_latest = false
WHERE  status NOT IN ('submitted')
   OR (status = 'submitted' AND id NOT IN (SELECT id FROM latest_per_match));

-- 4. 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_factory_quotes_match_latest
  ON public.factory_quotes (match_id, is_latest)
  WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_factory_quotes_match_version
  ON public.factory_quotes (match_id, version DESC);
