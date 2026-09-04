-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  last_name text not null,
  first_name text not null,
  class_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, last_name, first_name, class_name)
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  last_name text not null,
  first_name text not null,
  position text not null,
  created_at timestamptz not null default now(),
  unique (user_id, last_name, first_name, position)
);

alter table public.students enable row level security;
alter table public.teachers enable row level security;

drop policy if exists "students_owner_all" on public.students;
create policy "students_owner_all" on public.students
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "teachers_owner_all" on public.teachers;
create policy "teachers_owner_all" on public.teachers
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
