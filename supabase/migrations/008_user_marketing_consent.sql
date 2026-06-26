-- 마이페이지 > 계정 관리 > 개인정보 처리 동의(마케팅 정보 수신, 선택)
alter table public.users
  add column if not exists marketing_consent boolean not null default false;

comment on column public.users.marketing_consent is '마케팅 정보 수신 동의 (선택)';
