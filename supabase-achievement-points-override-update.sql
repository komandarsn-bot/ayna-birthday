-- Выполните один раз в Supabase: SQL Editor -> New query -> Run.
-- Добавляет индивидуальное количество баллов для отдельного достижения.

alter table public.achievements
  add column if not exists manual_points smallint;

alter table public.achievements
  drop constraint if exists achievements_manual_points_check;
alter table public.achievements
  add constraint achievements_manual_points_check
  check (manual_points between 0 and 1000);

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

  calculated_points := coalesce(
    new.manual_points,
    public.calculate_achievement_points(new.user_id, new.event_stage, new.result)
  );
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
after insert or update of student_id, event_stage, result, user_id, manual_points
on public.achievements
for each row execute function public.sync_student_achievement_points();

create or replace function public.recalculate_my_achievement_points()
returns void
as $function$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  delete from public.student_achievement_points where user_id = current_user_id;
  insert into public.student_achievement_points (
    user_id, student_id, achievement_id, event_stage,
    result_name, result_category, points, updated_at
  )
  select achievement.user_id, achievement.student_id, achievement.id,
    achievement.event_stage, achievement.result,
    public.achievement_result_category(achievement.result),
    coalesce(
      achievement.manual_points,
      public.calculate_achievement_points(achievement.user_id, achievement.event_stage, achievement.result)
    ),
    now()
  from public.achievements achievement
  where achievement.user_id = current_user_id
    and achievement.student_id is not null
    and coalesce(
      achievement.manual_points,
      public.calculate_achievement_points(achievement.user_id, achievement.event_stage, achievement.result)
    ) is not null;
end;
$function$
language plpgsql security definer set search_path = public;

revoke all on function public.recalculate_my_achievement_points() from public;
grant execute on function public.recalculate_my_achievement_points() to authenticated;
