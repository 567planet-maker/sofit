-- ============================================================
-- SOFIT — 레거시 쇼파 데이터 → 다분야 모델 이관 (Phase 6)
-- 기존 quote_requests의 쇼파 플랫 컬럼/공통 필드를
--   · quote_request_items(category='sofa', details jsonb)
--   · 신규 공통 컬럼(site_address/contact_name/contact_phone/…)
-- 으로 옮긴다.
--
-- ⚠️ 비파괴·멱등(idempotent): 레거시 컬럼은 DROP하지 않는다.
--    무손실 검증(아래 쿼리) 통과 후 별도 마이그레이션(017)에서 DROP한다.
--    여러 번 실행해도 중복/덮어쓰기 없이 동작한다.
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. 쇼파 플랫 컬럼 → quote_request_items(category='sofa')
--    sofa 스키마 키 = 레거시 컬럼명과 1:1 (개발순서 Phase 2 설계).
--    이미 sofa item이 있거나 쇼파 데이터가 전혀 없는 행은 건너뜀.
-- ──────────────────────────────────────────
INSERT INTO public.quote_request_items (request_id, category, schema_version, details, status)
SELECT
  q.id, 'sofa', 1,
  jsonb_strip_nulls(jsonb_build_object(
    'sofa_type',       q.sofa_type,
    'sofa_count',      q.sofa_count,
    'seat_count',      q.seat_count,
    'backrest_height', q.backrest_height,
    'cushion_type',    q.cushion_type,
    'frame_structure', q.frame_structure,
    'fabric_type',     q.fabric_type,
    'inner_material',  q.inner_material,
    'frame_material',  q.frame_material,
    'color_code',      q.color_code,
    'flame_retardant', q.flame_retardant,
    'waterproof',      q.waterproof,
    'has_armrest',     q.has_armrest,
    'total_length',    q.total_length,
    'total_width',     q.total_width,
    'total_height',    q.total_height,
    'seat_height',     q.seat_height,
    'seat_depth',      q.seat_depth
  )),
  'submitted'
FROM public.quote_requests q
WHERE (
    q.sofa_type IS NOT NULL OR q.sofa_count IS NOT NULL OR q.seat_count IS NOT NULL
    OR q.backrest_height IS NOT NULL OR q.cushion_type IS NOT NULL
    OR q.frame_structure IS NOT NULL OR q.fabric_type IS NOT NULL
    OR q.inner_material IS NOT NULL OR q.frame_material IS NOT NULL
    OR q.color_code IS NOT NULL OR q.flame_retardant IS NOT NULL
    OR q.waterproof IS NOT NULL OR q.has_armrest IS NOT NULL
    OR q.total_length IS NOT NULL OR q.total_width IS NOT NULL
    OR q.total_height IS NOT NULL OR q.seat_height IS NOT NULL OR q.seat_depth IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.quote_request_items i
    WHERE i.request_id = q.id AND i.category = 'sofa'
  );

-- ──────────────────────────────────────────
-- 2. 공통 필드 재매핑 (신규 컬럼이 비어 있는 레거시 행만; COALESCE로 멱등)
--    address(text)   → site_address jsonb { road, detail }
--    site_manager    → contact_name
--    contact         → contact_phone
--    company_name    → special_requests 앞에 "업체: …"로 보존 (신규 폼엔 항목 없음)
--    site_name/business_type/floor/has_elevator/has_parking/available_time/
--    needs_measurement 등은 기존 컬럼을 그대로 재사용 → 변환 불필요.
-- ──────────────────────────────────────────
UPDATE public.quote_requests q SET
  site_address = COALESCE(
    q.site_address,
    CASE WHEN q.address IS NOT NULL AND q.address <> ''
      THEN jsonb_build_object('road', q.address, 'detail', '')
    END
  ),
  contact_name  = COALESCE(q.contact_name,  NULLIF(q.site_manager, '')),
  contact_phone = COALESCE(q.contact_phone, NULLIF(q.contact, '')),
  special_requests = CASE
    WHEN q.company_name IS NOT NULL AND q.company_name <> ''
         AND (q.special_requests IS NULL OR q.special_requests NOT LIKE '업체:%')
    THEN '업체: ' || q.company_name || COALESCE(E'\n' || q.special_requests, '')
    ELSE q.special_requests
  END
WHERE q.address IS NOT NULL
   OR q.site_manager IS NOT NULL
   OR q.contact IS NOT NULL
   OR q.company_name IS NOT NULL;

-- ============================================================
-- 3. 무손실 검증 (DROP 전 반드시 통과 확인)
--   ① 쇼파 데이터 보유 요청 수 == 생성된 sofa item 수 (이미 있던 것 포함)
--      SELECT
--        (SELECT count(*) FROM quote_requests
--          WHERE sofa_type IS NOT NULL OR sofa_count IS NOT NULL OR total_length IS NOT NULL) AS legacy_sofa_rows,
--        (SELECT count(*) FROM quote_request_items WHERE category='sofa') AS sofa_items;
--   ② 주소/담당자/연락처 backfill 누락 점검 (0건이어야 정상)
--      SELECT count(*) FROM quote_requests
--      WHERE (address IS NOT NULL AND address <> '' AND site_address IS NULL)
--         OR (site_manager IS NOT NULL AND site_manager <> '' AND contact_name IS NULL)
--         OR (contact IS NOT NULL AND contact <> '' AND contact_phone IS NULL);
--   ③ 샘플 대조: 한 행의 레거시 vs 이관 결과 눈으로 확인
--      SELECT q.id, q.sofa_type, q.total_length, i.details, q.address, q.site_address
--      FROM quote_requests q JOIN quote_request_items i
--        ON i.request_id=q.id AND i.category='sofa' LIMIT 5;
--
-- ④ 검증 통과 후: 별도 017 마이그레이션에서 레거시 컬럼 DROP +
--    구 submitQuoteRequest / QuoteRequestForm.tsx 코드 삭제.
-- ============================================================
