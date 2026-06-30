-- ============================================================
-- SOFIT — 공장 ↔ 분야(전문 시공 분야) 태그 모델 (Phase 7 선행 블로커)
-- 개발순서 보정 #4: 27개 분야 매칭의 데이터 소스.
-- 기존 분야 데이터는 factory_portfolios.category(sofa/builtin/other) 3종뿐 →
-- 공장이 실제 시공 가능한 분야(CATEGORY_GROUPS 27종)를 N:M으로 태깅한다.
--
-- 비파괴(새 테이블만 추가). Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. factory_categories (공장 N:M 분야)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.factory_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id uuid NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
  category   text NOT NULL,                 -- categories.ts 의 CategoryKey (예: 'carpentry')
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (factory_id, category)             -- 같은 공장에 같은 분야 중복 방지
);

CREATE INDEX IF NOT EXISTS idx_fc_factory  ON public.factory_categories (factory_id);
CREATE INDEX IF NOT EXISTS idx_fc_category ON public.factory_categories (category);

-- ──────────────────────────────────────────
-- 2. RLS
-- ──────────────────────────────────────────
ALTER TABLE public.factory_categories ENABLE ROW LEVEL SECURITY;

-- 공장 본인: 자기 분야 태그 전체 권한 (선택·수정·삭제)
CREATE POLICY "fc: 공장 본인" ON public.factory_categories FOR ALL
  USING (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()))
  WITH CHECK (factory_id IN (SELECT id FROM public.factories WHERE user_id = auth.uid()));

-- 공개 조회: 전문 분야 노출/매칭 표시용 (민감 정보 아님)
CREATE POLICY "fc: 공개 조회" ON public.factory_categories FOR SELECT
  USING (true);

-- admin 전체
CREATE POLICY "fc: admin" ON public.factory_categories FOR ALL
  USING (get_my_role() = 'admin');

-- ============================================================
-- 적용 후 검증
--   1) 공장 계정으로 INSERT/SELECT 가능:
--        INSERT INTO factory_categories (factory_id, category)
--        VALUES ('<내 factory_id>', 'carpentry');
--   2) 다른 공장 계정으로 위 row UPDATE/DELETE 시 0건 (RLS).
--   3) anon key로 SELECT는 허용(공개), INSERT는 거부되어야 함.
-- ============================================================
