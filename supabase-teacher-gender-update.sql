-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

alter table public.teachers
  add column if not exists gender text;

alter table public.teachers
  drop constraint if exists teachers_gender_check;

alter table public.teachers
  add constraint teachers_gender_check
  check (gender is null or gender in ('М', 'Ж'));
