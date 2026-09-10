-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

alter table public.students
  add column if not exists middle_name text;
