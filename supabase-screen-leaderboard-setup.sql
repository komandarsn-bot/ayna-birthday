-- Настройки и безопасная выдача топ-10 учеников на телевизионный экран.
-- Выполните файл целиком один раз: Supabase -> SQL Editor -> New query -> Run.

create table if not exists public.screen_leaderboard_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  is_enabled boolean not null default true,
  period_type text not null default 'school_year'
    check (period_type in ('week', 'month', 'quarter', 'school_year')),
  quarter_1_start date,
  quarter_1_end date,
  quarter_2_start date,
  quarter_2_end date,
  quarter_3_start date,
  quarter_3_end date,
  quarter_4_start date,
  quarter_4_end date,
  updated_at timestamptz not null default now()
);

alter table public.screen_leaderboard_settings add column if not exists quarter_1_start date;
alter table public.screen_leaderboard_settings add column if not exists quarter_1_end date;
alter table public.screen_leaderboard_settings add column if not exists quarter_2_start date;
alter table public.screen_leaderboard_settings add column if not exists quarter_2_end date;
alter table public.screen_leaderboard_settings add column if not exists quarter_3_start date;
alter table public.screen_leaderboard_settings add column if not exists quarter_3_end date;
alter table public.screen_leaderboard_settings add column if not exists quarter_4_start date;
alter table public.screen_leaderboard_settings add column if not exists quarter_4_end date;

alter table public.screen_leaderboard_settings enable row level security;

drop policy if exists "screen_leaderboard_settings_owner_all" on public.screen_leaderboard_settings;
create policy "screen_leaderboard_settings_owner_all"
on public.screen_leaderboard_settings
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop function if exists public.get_screen_leaderboard(uuid);
create function public.get_screen_leaderboard(p_access_token uuid)
returns table (
  shift_number integer,
  place_number bigint,
  student_name text,
  class_name text,
  achievements_count bigint,
  total_points bigint,
  period_label text
)
as $function$
  with screen_owner as (
    select screen.user_id
    from public.screens screen
    where screen.access_token = p_access_token
    limit 1
  ), settings as (
    select
      owner.user_id,
      coalesce(setting.is_enabled, true) as is_enabled,
      coalesce(setting.period_type, 'school_year') as period_type,
      setting.quarter_1_start,
      setting.quarter_1_end,
      setting.quarter_2_start,
      setting.quarter_2_end,
      setting.quarter_3_start,
      setting.quarter_3_end,
      setting.quarter_4_start,
      setting.quarter_4_end,
      (now() at time zone 'Asia/Qyzylorda')::date as today
    from screen_owner owner
    left join public.screen_leaderboard_settings setting on setting.user_id = owner.user_id
  ), period_bounds as (
    select
      settings.*,
      case settings.period_type
        when 'week' then date_trunc('week', settings.today::timestamp)::date
        when 'month' then date_trunc('month', settings.today::timestamp)::date
        when 'quarter' then case
          when extract(month from settings.today) between 9 and 10 then coalesce(settings.quarter_1_start, make_date(extract(year from settings.today)::integer, 9, 1))
          when extract(month from settings.today) between 11 and 12 then coalesce(settings.quarter_2_start, make_date(extract(year from settings.today)::integer, 11, 1))
          when extract(month from settings.today) between 1 and 3 then coalesce(settings.quarter_3_start, make_date(extract(year from settings.today)::integer, 1, 1))
          when extract(month from settings.today) between 4 and 5 then coalesce(settings.quarter_4_start, make_date(extract(year from settings.today)::integer, 4, 1))
          else make_date(extract(year from settings.today)::integer, 6, 1)
        end
        else make_date(
          case when extract(month from settings.today) >= 9 then extract(year from settings.today)::integer else extract(year from settings.today)::integer - 1 end,
          9, 1
        )
      end as date_from,
      case settings.period_type
        when 'week' then (date_trunc('week', settings.today::timestamp)::date + 6)
        when 'month' then (date_trunc('month', settings.today::timestamp) + interval '1 month - 1 day')::date
        when 'quarter' then case
          when extract(month from settings.today) between 9 and 10 then coalesce(settings.quarter_1_end, make_date(extract(year from settings.today)::integer, 10, 31))
          when extract(month from settings.today) between 11 and 12 then coalesce(settings.quarter_2_end, make_date(extract(year from settings.today)::integer, 12, 31))
          when extract(month from settings.today) between 1 and 3 then coalesce(settings.quarter_3_end, make_date(extract(year from settings.today)::integer, 3, 31))
          when extract(month from settings.today) between 4 and 5 then coalesce(settings.quarter_4_end, make_date(extract(year from settings.today)::integer, 5, 31))
          else make_date(extract(year from settings.today)::integer, 8, 31)
        end
        else make_date(
          case when extract(month from settings.today) >= 9 then extract(year from settings.today)::integer + 1 else extract(year from settings.today)::integer end,
          8, 31
        )
      end as date_to
    from settings
  ), student_totals as (
    select
      case
        when substring(student.class_name from '^\s*(\d+)')::integer between 8 and 11 then 1
        when substring(student.class_name from '^\s*(\d+)')::integer between 5 and 7 then 2
      end as shift_number,
      student.id as student_id,
      concat_ws(' ', student.last_name, student.first_name) as student_name,
      student.class_name,
      count(point.id) as achievements_count,
      sum(point.points)::bigint as total_points,
      bounds.period_type,
      bounds.date_from,
      bounds.date_to
    from period_bounds bounds
    join public.students student on student.user_id = bounds.user_id
    join public.student_achievement_points point
      on point.user_id = bounds.user_id and point.student_id = student.id
    join public.achievements achievement
      on achievement.id = point.achievement_id and achievement.user_id = bounds.user_id
    where bounds.is_enabled
      and coalesce(achievement.event_end_date, achievement.event_date) >= bounds.date_from
      and coalesce(achievement.event_date, achievement.event_end_date) <= bounds.date_to
      and substring(student.class_name from '^\s*(\d+)')::integer between 5 and 11
    group by bounds.period_type, bounds.date_from, bounds.date_to, student.id,
      student.last_name, student.first_name, student.class_name
  ), ranked as (
    select
      totals.*,
      dense_rank() over (partition by totals.shift_number order by totals.total_points desc) as place_number,
      row_number() over (
        partition by totals.shift_number
        order by totals.total_points desc, totals.student_name, totals.student_id
      ) as display_number
    from student_totals totals
    where totals.total_points > 0 and totals.shift_number is not null
  )
  select
    ranked.shift_number,
    ranked.place_number,
    ranked.student_name,
    ranked.class_name,
    ranked.achievements_count,
    ranked.total_points,
    case ranked.period_type
      when 'week' then 'За текущую неделю'
      when 'month' then 'За текущий месяц'
      when 'quarter' then 'За текущую четверть'
      else 'За текущий учебный год'
    end as period_label
  from ranked
  where ranked.display_number <= 10
  order by ranked.shift_number, ranked.display_number;
$function$
language sql
security definer
set search_path = public
stable;

revoke all on function public.get_screen_leaderboard(uuid) from public;
grant execute on function public.get_screen_leaderboard(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
