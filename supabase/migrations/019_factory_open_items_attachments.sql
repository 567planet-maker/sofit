-- ============================================================
-- SOFIT — 분야 항목·첨부를 활성 공장 전체에 공개 (Phase 8)
-- 기존: quote_request_items / quote_request_attachments 는 "매칭된 공장만" 조회.
-- 변경: 007(quote_requests 공장 오픈)과 동일하게, 활성 공장이 제출된 요청의
--       분야 항목·현장 사진·도면을 매칭 전에도 볼 수 있게 한다(둘러보고 참여 판단).
--
-- · 기존 "매칭 조회"/"고객 본인"/"admin" 정책과 OR로 합산되는 추가 정책.
-- · draft(작성 중)·계약 이후(contracted/in_progress/completed) 요청은 제외.
-- 비파괴(정책만 추가). Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- 분야 항목: 활성 공장 전체 조회
CREATE POLICY "qri: 공장 신규 전체 조회" ON public.quote_request_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.factories
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND request_id IN (
      SELECT id FROM public.quote_requests
      WHERE status NOT IN ('draft', 'contracted', 'in_progress', 'completed')
    )
  );

-- 첨부(현장 사진·도면): 활성 공장 전체 조회
CREATE POLICY "qra: 공장 신규 전체 조회" ON public.quote_request_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.factories
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND request_id IN (
      SELECT id FROM public.quote_requests
      WHERE status NOT IN ('draft', 'contracted', 'in_progress', 'completed')
    )
  );

-- ============================================================
-- 적용 후: 매칭 안 된 활성 공장도 제출된 요청 상세에서 분야 항목 + 현장 사진을
--   볼 수 있음(참여 판단용). 작성 중(draft) 요청은 여전히 비공개.
-- ============================================================
