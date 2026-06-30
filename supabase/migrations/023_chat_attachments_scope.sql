-- ============================================================
-- SOFIT — chat-attachments 버킷을 "방 참여자"로 스코프 (Phase 8 보안)
-- 기존(003): bucket_id='chat-attachments' AND auth.uid() IS NOT NULL
--   → 로그인한 누구나 업로드·조회 가능(참여자 범위 아님).
-- 변경: 객체 경로 첫 폴더(room_id)가 "내가 볼 수 있는 채팅방"일 때만 허용.
--   업로드 경로 규칙: `${roomId}/${timestamp}.${ext}` (ChatRoom.tsx).
--   chat_rooms의 SELECT RLS(참여자/admin)를 그대로 재사용한다.
--
-- ⚠️ 사전 조건: Supabase 대시보드 > Storage > chat-attachments 버킷을
--    Public = false(비공개)로 설정해야 RLS가 실제로 적용된다.
--    공개 버킷이면 RLS와 무관하게 누구나 public URL로 접근 가능.
-- Supabase SQL 에디터에서 전체 실행.
-- ============================================================

-- 기존 느슨한 정책 제거(003에서 생성한 동일 이름)
DROP POLICY IF EXISTS "chat-attachments: 참여자 업로드" ON storage.objects;
DROP POLICY IF EXISTS "chat-attachments: 참여자 조회"   ON storage.objects;

-- 조회: 경로 첫 폴더(room_id)가 내가 볼 수 있는 채팅방일 때만.
--   서브쿼리 SELECT id FROM chat_rooms 는 호출자 RLS가 적용되어
--   참여 중인 방(또는 admin은 전체)만 반환된다.
CREATE POLICY "chat-attachments: 참여자 조회" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.chat_rooms
    )
  );

-- 업로드: 참여 중인 방 폴더에만.
CREATE POLICY "chat-attachments: 참여자 업로드" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.chat_rooms
    )
  );

-- (admin 삭제 정책 "chat-attachments: admin 삭제"는 003 그대로 유지)

-- ============================================================
-- 적용 후 검증
--   1) 버킷 Public=false 확인.
--   2) 방 A 참여자가 A 폴더 객체 signed URL 생성 가능, 방 B 폴더는 불가.
--   3) 미참여 사용자가 임의 room_id 폴더 객체 조회·업로드 시 거부.
--   ※ 기존에 public URL로 저장된 과거 첨부는 비공개 전환 후 접근 불가해질 수 있음
--      (신규 메시지는 경로 저장 + signed URL 사용).
-- ============================================================
