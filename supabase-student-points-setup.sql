-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.
-- Он создаёт журнал баллов и автоматически пересчитывает его при изменении достижений.

create table if not exists public.student_achievement_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  student_id uuid not null references public.students(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  event_stage text not null,
  result_name text not null,
  result_category text not null check (result_category in (
    '1 место / абсолютный чемпион',
    '2 место',
    '3 место',
    'номинация / грамота',
    'сертификат'
  )),
  points smallint not null check (points between 1 and 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (achievement_id)
);

create index if not exists student_achievement_points_student_idx
  on public.student_achievement_points (student_id);
create index if not exists student_achievement_points_user_points_idx
  on public.student_achievement_points (user_id, points desc);

alter table public.student_achievement_points enable row level security;

drop policy if exists "student_achievement_points_owner_select" on public.student_achievement_points;
create policy "student_achievement_points_owner_select" on public.student_achievement_points
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "student_achievement_points_owner_insert" on public.student_achievement_points;
create policy "student_achievement_points_owner_insert" on public.student_achievement_points
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "student_achievement_points_owner_update" on public.student_achievement_points;
create policy "student_achievement_points_owner_update" on public.student_achievement_points
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "student_achievement_points_owner_delete" on public.student_achievement_points;
create policy "student_achievement_points_owner_delete" on public.student_achievement_points
  for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.achievement_result_category(p_result text)
returns text
as $function$
  select case
    when lower(trim(p_result)) in ('1 место', 'абсолютный чемпион')
      then '1 место / абсолютный чемпион'
    when lower(trim(p_result)) = '2 место' then '2 место'
    when lower(trim(p_result)) = '3 место' then '3 место'
    when lower(trim(p_result)) = 'сертификат' then 'сертификат'
    when nullif(trim(p_result), '') is not null then 'номинация / грамота'
    else null
  end;
$function$
language sql
immutable;

create or replace function public.calculate_achievement_points(p_stage text, p_result text)
returns smallint
as $function$
  with scoring as (
    select case lower(trim(p_stage))
      when 'школьный' then 5
      when 'районный' then 6
      when 'городской' then 8
      when 'республиканский' then 12
      when 'международный' then 16
      else null
    end as maximum_points,
    public.achievement_result_category(p_result) as category
  )
  select case category
    when '1 место / абсолютный чемпион' then maximum_points
    when '2 место' then maximum_points - 1
    when '3 место' then maximum_points - 2
    when 'номинация / грамота' then maximum_points - 3
    when 'сертификат' then maximum_points - 4
    else null
  end::smallint
  from scoring;
$function$
language sql
immutable;

create or replace function public.sync_student_achievement_points()
returns trigger
as $function$
declare
  calculated_points smallint;
  calculated_category text;
begin
  if new.student_id is null then
    delete from public.student_achievement_points where achievement_id = new.id;
    return new;
  end if;

  calculated_points := public.calculate_achievement_points(new.event_stage, new.result);
  calculated_category := public.achievement_result_category(new.result);

  if calculated_points is null or calculated_category is null then
    delete from public.student_achievement_points where achievement_id = new.id;
    return new;
  end if;

  insert into public.student_achievement_points (
    user_id, student_id, achievement_id, event_stage,
    result_name, result_category, points, updated_at
  ) values (
    new.user_id, new.student_id, new.id, new.event_stage,
    new.result, calculated_category, calculated_points, now()
  )
  on conflict (achievement_id) do update set
    user_id = excluded.user_id,
    student_id = excluded.student_id,
    event_stage = excluded.event_stage,
    result_name = excluded.result_name,
    result_category = excluded.result_category,
    points = excluded.points,
    updated_at = now();

  return new;
end;
$function$
language plpgsql
security definer
set search_path = public;

drop trigger if exists achievements_sync_student_points on public.achievements;
create trigger achievements_sync_student_points
after insert or update of student_id, event_stage, result, user_id
on public.achievements
for each row execute function public.sync_student_achievement_points();

-- Пересчёт всех достижений, которые уже есть в базе.
insert into public.student_achievement_points (
  user_id, student_id, achievement_id, event_stage,
  result_name, result_category, points, updated_at
)
select
  achievement.user_id,
  achievement.student_id,
  achievement.id,
  achievement.event_stage,
  achievement.result,
  public.achievement_result_category(achievement.result),
  public.calculate_achievement_points(achievement.event_stage, achievement.result),
  now()
from public.achievements achievement
where achievement.student_id is not null
  and public.calculate_achievement_points(achievement.event_stage, achievement.result) is not null
on conflict (achievement_id) do update set
  user_id = excluded.user_id,
  student_id = excluded.student_id,
  event_stage = excluded.event_stage,
  result_name = excluded.result_name,
  result_category = excluded.result_category,
  points = excluded.points,
  updated_at = now();

create or replace view public.student_points_totals
with (security_invoker = true)
as
select
  student.user_id,
  student.id as student_id,
  student.last_name,
  student.first_name,
  student.class_name,
  count(point.id)::integer as achievements_count,
  coalesce(sum(point.points), 0)::integer as total_points
from public.students student
left join public.student_achievement_points point
  on point.student_id = student.id and point.user_id = student.user_id
group by student.user_id, student.id, student.last_name, student.first_name, student.class_name;

grant select on public.student_points_totals to authenticated;
