-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  last_name text not null,
  first_name text not null,
  class_name text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, last_name, first_name, class_name)
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  last_name text not null,
  first_name text not null,
  position text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, last_name, first_name, position)
);

-- Обновление таблиц, если предыдущая версия этого файла уже выполнялась.
alter table public.students add column if not exists birth_date date;
alter table public.teachers add column if not exists birth_date date;

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

-- ТВ-экран получает сегодняшние дни рождения из общей базы школы.
drop function if exists public.get_screen_birthdays(uuid);
create function public.get_screen_birthdays(p_access_token uuid)
returns table (
  full_name text,
  person_position text
)
language sql
security definer
set search_path = public
as $$
  with screen_owner as (
    select user_id
    from public.screens
    where access_token = p_access_token
    limit 1
  ), today_in_school as (
    select (now() at time zone 'Asia/Qyzylorda')::date as value
  )
  select concat_ws(' ', student.last_name, student.first_name), student.class_name
  from public.students student
  join screen_owner owner on owner.user_id = student.user_id
  cross join today_in_school today
  where extract(month from student.birth_date) = extract(month from today.value)
    and extract(day from student.birth_date) = extract(day from today.value)

  union all

  select concat_ws(' ', teacher.last_name, teacher.first_name), teacher.position
  from public.teachers teacher
  join screen_owner owner on owner.user_id = teacher.user_id
  cross join today_in_school today
  where extract(month from teacher.birth_date) = extract(month from today.value)
    and extract(day from teacher.birth_date) = extract(day from today.value);
$$;

revoke all on function public.get_screen_birthdays(uuid) from public;
grant execute on function public.get_screen_birthdays(uuid) to anon, authenticated;
