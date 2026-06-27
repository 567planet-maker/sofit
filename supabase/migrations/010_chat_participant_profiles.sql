-- ============================================================
-- 채팅 상대 프로필(이름·사진) 조회 허용
-- 기존: users 는 본인 + admin 만 SELECT 가능 → 채팅 상대 이름/아바타가 안 보임
-- 추가: 같은 채팅방에서 메시지를 주고받은 상대의 users 행을 조회 허용
-- Supabase SQL Editor 에서 실행
-- ============================================================

create policy "users: 채팅 상대 프로필 조회" on public.users
  for select to authenticated
  using (
    exists (
      select 1
      from public.chat_messages mine
      join public.chat_messages theirs on theirs.room_id = mine.room_id
      where mine.sender_id = auth.uid()
        and theirs.sender_id = public.users.id
    )
  );

-- 성능: 위 정책의 서브쿼리용 인덱스
create index if not exists idx_chat_messages_sender_room
  on public.chat_messages (sender_id, room_id);
