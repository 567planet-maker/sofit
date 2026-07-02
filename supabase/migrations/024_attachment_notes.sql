-- ============================================================
-- SOFIT — 견적 첨부에 "파일 설명(note)" 컬럼 추가
-- 고객이 업로드한 사진·도면마다 설명 텍스트를 달 수 있도록.
--   전체(item_id NULL) / 분야별(item_id) 첨부 모두 동일하게 사용.
-- RLS 변경 없음: 기존 quote_request_attachments 정책이 request_id 소유권을
--   따라가므로 신규 컬럼도 동일하게 보호된다.
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

ALTER TABLE public.quote_request_attachments
  ADD COLUMN IF NOT EXISTS note text;

-- ============================================================
-- 적용 후 검증
--   1) \d public.quote_request_attachments 로 note 컬럼 확인.
--   2) 고객이 본인 요청의 첨부 note UPDATE 가능, 타 요청 첨부는 RLS로 차단.
-- ============================================================
