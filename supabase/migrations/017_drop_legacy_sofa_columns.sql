-- ============================================================
-- SOFIT — 레거시 쇼파 컬럼 DROP (Phase 6 마무리)
-- 016 이관 + 무손실 검증(sofa_rows_unmigrated=0, backfill_missing=0) 통과 후 실행.
--
-- 범위: 쇼파 도메인(제품·규격·자재) + 레거시 전용 일정 컬럼만 DROP.
--   · 코드에서 명시적으로 select하지 않는 컬럼(전부 SELECT * 로만 접근) → 안전.
--   · 공통 레거시 컬럼(company_name/contact/site_manager/address)은 다수 화면이
--     라벨로 직접 select하므로 이 마이그레이션에서 제외(후속 작업에서 site_name 등으로 전환 후 DROP).
--
-- 무손실: DROP 전에 016에서 빠진 잔여 값(추가 규격·레거시 일정)을 sofa item details에 보존.
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. 016에서 빠진 잔여 레거시 값을 sofa item details에 보존(아카이브)
--    (sofa 스키마에 없던 wall_length/corner_angle + 레거시 일정 필드)
-- ──────────────────────────────────────────
UPDATE public.quote_request_items i
SET details = i.details || jsonb_strip_nulls(jsonb_build_object(
  'wall_length',       q.wall_length,
  'corner_angle',      q.corner_angle,
  'install_hours',     q.install_hours,
  'measurement_date',  q.measurement_date,
  'production_start',  q.production_start,
  'production_end',    q.production_end,
  'delivery_date',     q.delivery_date,
  'install_date',      q.install_date,
  'as_available_date', q.as_available_date
))
FROM public.quote_requests q
WHERE i.request_id = q.id
  AND i.category = 'sofa'
  AND (
    q.wall_length IS NOT NULL OR q.corner_angle IS NOT NULL OR q.install_hours IS NOT NULL
    OR q.measurement_date IS NOT NULL OR q.production_start IS NOT NULL OR q.production_end IS NOT NULL
    OR q.delivery_date IS NOT NULL OR q.install_date IS NOT NULL OR q.as_available_date IS NOT NULL
  );

-- ──────────────────────────────────────────
-- 2. 레거시 쇼파 도메인 + 레거시 일정 컬럼 DROP (IF EXISTS로 안전)
-- ──────────────────────────────────────────
ALTER TABLE public.quote_requests
  -- 제품
  DROP COLUMN IF EXISTS sofa_type,
  DROP COLUMN IF EXISTS sofa_count,
  DROP COLUMN IF EXISTS seat_count,
  DROP COLUMN IF EXISTS backrest_height,
  DROP COLUMN IF EXISTS has_armrest,
  DROP COLUMN IF EXISTS cushion_type,
  DROP COLUMN IF EXISTS frame_structure,
  DROP COLUMN IF EXISTS flame_retardant,
  DROP COLUMN IF EXISTS waterproof,
  -- 규격
  DROP COLUMN IF EXISTS total_length,
  DROP COLUMN IF EXISTS total_width,
  DROP COLUMN IF EXISTS total_height,
  DROP COLUMN IF EXISTS seat_height,
  DROP COLUMN IF EXISTS seat_depth,
  DROP COLUMN IF EXISTS wall_length,
  DROP COLUMN IF EXISTS corner_angle,
  -- 자재
  DROP COLUMN IF EXISTS fabric_type,
  DROP COLUMN IF EXISTS inner_material,
  DROP COLUMN IF EXISTS frame_material,
  DROP COLUMN IF EXISTS color_code,
  -- 레거시 일정 (신규 흐름은 desired_start_date/desired_end_date 사용)
  DROP COLUMN IF EXISTS install_hours,
  DROP COLUMN IF EXISTS measurement_date,
  DROP COLUMN IF EXISTS production_start,
  DROP COLUMN IF EXISTS production_end,
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS install_date,
  DROP COLUMN IF EXISTS as_available_date;

-- ============================================================
-- 적용 후 확인
--   · 컬럼 삭제됨: \d public.quote_requests (위 컬럼 없어야 함)
--   · sofa item에 규격이 그대로 남아있나:
--       SELECT details FROM quote_request_items WHERE category='sofa' LIMIT 5;
--
-- 후속(별도): 공통 레거시 컬럼 company_name/contact/site_manager/address 도
--   화면 라벨을 site_name/contact_name 으로 전환한 뒤 DROP.
-- ============================================================
