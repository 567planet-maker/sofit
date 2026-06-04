-- ============================================================
-- SOFIT — 견적서 수락 RLS 패치
-- 1. factory가 quote_requests 상태를 업데이트할 수 있도록 (견적 제출 시)
-- 2. customer가 quote_requests 상태를 업데이트할 수 있도록 (견적 수락 시)
-- 3. customer가 factory_quotes를 accepted로 업데이트할 수 있도록
-- 4. customer가 status_logs를 INSERT할 수 있도록
-- 5. customer가 accepted 상태 견적서도 조회할 수 있도록
-- ============================================================

-- 1. factory → quote_requests UPDATE (견적 제출 시 상태 변경)
CREATE POLICY "requests: 공장 상태 업데이트" ON public.quote_requests FOR UPDATE
  USING (id IN (
    SELECT m.request_id FROM public.matches m
    JOIN public.factories f ON m.factory_id = f.id
    WHERE f.user_id = auth.uid() AND m.status = 'confirmed'
  ))
  WITH CHECK (id IN (
    SELECT m.request_id FROM public.matches m
    JOIN public.factories f ON m.factory_id = f.id
    WHERE f.user_id = auth.uid() AND m.status = 'confirmed'
  ));

-- 2. customer → quote_requests UPDATE (견적 수락 시 contracted로 변경)
CREATE POLICY "requests: 고객 상태 업데이트" ON public.quote_requests FOR UPDATE
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- 3. customer → factory_quotes UPDATE (수락 처리)
CREATE POLICY "quotes: 고객 수락" ON public.factory_quotes FOR UPDATE
  USING (
    match_id IN (
      SELECT m.id FROM public.matches m
      JOIN public.quote_requests r ON m.request_id = r.id
      JOIN public.customers c ON r.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    match_id IN (
      SELECT m.id FROM public.matches m
      JOIN public.quote_requests r ON m.request_id = r.id
      JOIN public.customers c ON r.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- 4. customer → status_logs INSERT (수락 이력 기록)
CREATE POLICY "status_logs: 고객 INSERT" ON public.status_logs FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM public.quote_requests
      WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
  );

-- 5. 고객 견적 조회 정책에 'accepted' 상태 추가
DROP POLICY IF EXISTS "quotes: 고객 조회" ON public.factory_quotes;
CREATE POLICY "quotes: 고객 조회" ON public.factory_quotes FOR SELECT
  USING (
    status IN ('submitted', 'superseded', 'accepted')
    AND match_id IN (
      SELECT m.id FROM public.matches m
      JOIN public.quote_requests r ON m.request_id = r.id
      JOIN public.customers c ON r.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
