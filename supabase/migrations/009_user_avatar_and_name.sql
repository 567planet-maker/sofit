-- ============================================================
-- 프로필 강화 — 아바타(프로필 사진) + 회원가입 시 이름 저장
-- Supabase SQL Editor 에서 실행
-- ============================================================

-- 1. users.avatar_url 컬럼
alter table public.users
  add column if not exists avatar_url text;

comment on column public.users.avatar_url is '프로필 사진 (storage: avatars 버킷 경로의 public URL)';

-- 2. 신규 가입 시 메타데이터의 name 을 users.name 으로 복사
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'customer');

  insert into public.customers (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- 3. avatars 스토리지 버킷 (공개) + 정책
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 누구나 읽기(공개)
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- 인증 사용자: 본인 폴더(<uid>/...)에만 업로드/수정/삭제
drop policy if exists "avatars: 본인 업로드" on storage.objects;
create policy "avatars: 본인 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: 본인 수정" on storage.objects;
create policy "avatars: 본인 수정" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: 본인 삭제" on storage.objects;
create policy "avatars: 본인 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
