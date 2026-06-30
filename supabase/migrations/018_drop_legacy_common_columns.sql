-- ============================================================
-- SOFIT — 공통 레거시 컬럼 DROP (Phase 6 완전 종료)
-- 016에서 이미 신규 컬럼으로 재매핑 완료:
--   address      → site_address (jsonb)
--   site_manager → contact_name
--   contact      → contact_phone
--   company_name → special_requests ("업체: …"로 보존)
--
-- 코드 측: 이 컬럼들을 명시적으로 select하던 화면(관리자/공장/채팅 등)을
--   모두 site_name/contact_name 표시로 전환 완료 → 명시적 select 0건.
--   상세 3화면의 레거시(`!isNew`) 섹션은 SELECT * 로만 접근하므로 DROP 후
--   해당 키가 사라져도 falsy 처리되어 안전(렌더 안 됨).
--
-- 017 적용 후 실행. Supabase SQL 에디터에서 전체 실행.
-- ============================================================

ALTER TABLE public.quote_requests
  DROP COLUMN IF EXISTS company_name,
  DROP COLUMN IF EXISTS contact,
  DROP COLUMN IF EXISTS site_manager,
  DROP COLUMN IF EXISTS address;

-- ============================================================
-- 적용 후 확인
--   · \d public.quote_requests 에 위 4개 컬럼이 없어야 함.
--   · 관리자/공장 목록·채팅에서 현장명(site_name) 정상 표시.
-- 이로써 레거시 쇼파/공통 컬럼 정리 완료 → Phase 6 종료.
-- ============================================================
