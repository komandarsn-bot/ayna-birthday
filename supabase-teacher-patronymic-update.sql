-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

alter table public.teachers
  add column if not exists middle_name text;

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

  select concat_ws(' ', teacher.last_name, teacher.first_name, nullif(teacher.middle_name, '')), teacher.position
  from public.teachers teacher
  join screen_owner owner on owner.user_id = teacher.user_id
  cross join today_in_school today
  where extract(month from teacher.birth_date) = extract(month from today.value)
    and extract(day from teacher.birth_date) = extract(day from today.value);
$$;

revoke all on function public.get_screen_birthdays(uuid) from public;
grant execute on function public.get_screen_birthdays(uuid) to anon, authenticated;
