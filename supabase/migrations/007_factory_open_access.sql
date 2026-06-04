-- ============================================================
-- SOFIT — 공장 자율 매칭 시스템
-- 고객이 요청서 제출 시 모든 활성 공장이 즉시 확인 가능
-- 공장이 직접 참여 수락 → matches 레코드 생성
-- ============================================================

-- 1. 활성 공장은 계약 완료/시공/완료 전 모든 요청서를 볼 수 있음
--    (기존 "requests: 공장 매칭된 조회"와 OR로 합산됨)
CREATE POLICY "requests: 공장 신규 전체 조회" ON public.quote_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.factories
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
    AND status NOT IN ('contracted', 'in_progress', 'completed')
  );

-- 2. 활성 공장이 직접 matches 레코드를 생성할 수 있음 (자율 참여)
--    service client를 쓰는 server action에서 처리하므로 보조 정책
CREATE POLICY "matches: 공장 자율 참여" ON public.matches FOR INSERT
  WITH CHECK (
    factory_id IN (
      SELECT id FROM public.factories
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
    AND status = 'confirmed'
  );
