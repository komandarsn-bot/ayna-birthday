-- Настраиваемое количество учеников в рейтинге ТВ (1–20).
-- Выполните файл целиком в Supabase SQL Editor.

alter table public.screen_leaderboard_settings
  add column if not exists top_count integer not null default 10;
alter table public.screen_leaderboard_settings
  drop constraint if exists screen_leaderboard_settings_top_count_check;
alter table public.screen_leaderboard_settings
  add constraint screen_leaderboard_settings_top_count_check
  check (top_count between 1 and 20);

drop function if exists public.get_screen_leaderboard(uuid);
create function public.get_screen_leaderboard(p_access_token uuid)
returns table (
  group_key text,
  group_label text,
  place_number bigint,
  student_name text,
  class_name text,
  achievements_count bigint,
  total_points bigint,
  period_label text,
  top_count integer
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
      coalesce(setting.group_mode, 'all') as group_mode,
      coalesce(setting.top_count, 10) as top_count,
      coalesce(setting.selected_groups, '[]'::jsonb) as selected_groups,
      coalesce(setting.class_shift_map, '{}'::jsonb) as class_shift_map,
      setting.quarter_1_start, setting.quarter_1_end,
      setting.quarter_2_start, setting.quarter_2_end,
      setting.quarter_3_start, setting.quarter_3_end,
      setting.quarter_4_start, setting.quarter_4_end,
      (now() at time zone 'Asia/Qyzylorda')::date as today
    from screen_owner owner
    left join public.screen_leaderboard_settings setting on setting.user_id = owner.user_id
  ), period_bounds as (
    select settings.*,
      case settings.period_type
        when 'all_time' then date '1900-01-01'
        when 'week' then date_trunc('week', settings.today::timestamp)::date
        when 'month' then date_trunc('month', settings.today::timestamp)::date
        when 'quarter' then case
          when settings.today between settings.quarter_1_start and settings.quarter_1_end then settings.quarter_1_start
          when settings.today between settings.quarter_2_start and settings.quarter_2_end then settings.quarter_2_start
          when settings.today between settings.quarter_3_start and settings.quarter_3_end then settings.quarter_3_start
          when settings.today between settings.quarter_4_start and settings.quarter_4_end then settings.quarter_4_start
          else settings.today
        end
        else make_date(case when extract(month from settings.today) >= 9 then extract(year from settings.today)::integer else extract(year from settings.today)::integer - 1 end, 9, 1)
      end as date_from,
      case settings.period_type
        when 'all_time' then date '9999-12-31'
        when 'week' then date_trunc('week', settings.today::timestamp)::date + 6
        when 'month' then (date_trunc('month', settings.today::timestamp) + interval '1 month - 1 day')::date
        when 'quarter' then case
          when settings.today between settings.quarter_1_start and settings.quarter_1_end then settings.quarter_1_end
          when settings.today between settings.quarter_2_start and settings.quarter_2_end then settings.quarter_2_end
          when settings.today between settings.quarter_3_start and settings.quarter_3_end then settings.quarter_3_end
          when settings.today between settings.quarter_4_start and settings.quarter_4_end then settings.quarter_4_end
          else settings.today
        end
        else make_date(case when extract(month from settings.today) >= 9 then extract(year from settings.today)::integer + 1 else extract(year from settings.today)::integer end, 8, 31)
      end as date_to
    from settings
  ), prepared as (
    select
      case bounds.group_mode
        when 'shift' then bounds.class_shift_map ->> student.class_name
        when 'grade' then substring(student.class_name from '^\s*(\d+)')
        when 'class' then student.class_name
        else 'all'
      end as group_key,
      bounds.group_mode,
      bounds.top_count,
      bounds.selected_groups,
      student.id as student_id,
      concat_ws(' ', student.last_name, student.first_name) as student_name,
      student.class_name,
      count(point.id) as achievements_count,
      sum(point.points)::bigint as total_points,
      bounds.period_type
    from period_bounds bounds
    join public.students student on student.user_id = bounds.user_id
    join public.student_achievement_points point on point.user_id = bounds.user_id and point.student_id = student.id
    join public.achievements achievement on achievement.id = point.achievement_id and achievement.user_id = bounds.user_id
    where bounds.is_enabled
      and coalesce(achievement.event_end_date, achievement.event_date) >= bounds.date_from
      and coalesce(achievement.event_date, achievement.event_end_date) <= bounds.date_to
    group by bounds.group_mode, bounds.top_count, bounds.selected_groups, bounds.class_shift_map,
      bounds.period_type, student.id, student.last_name, student.first_name, student.class_name
  ), filtered as (
    select prepared.*
    from prepared
    where prepared.group_key is not null
      and (jsonb_array_length(prepared.selected_groups) = 0 or prepared.selected_groups ? prepared.group_key)
      and prepared.total_points > 0
  ), ranked as (
    select filtered.*,
      dense_rank() over (partition by filtered.group_key order by filtered.total_points desc) as place_number,
      row_number() over (partition by filtered.group_key order by filtered.total_points desc, filtered.student_name, filtered.student_id) as display_number
    from filtered
  )
  select ranked.group_key,
    case ranked.group_mode
      when 'shift' then ranked.group_key || ' смена'
      when 'grade' then ranked.group_key || ' классы'
      when 'class' then ranked.group_key
      else 'Общий рейтинг'
    end,
    ranked.place_number, ranked.student_name, ranked.class_name,
    ranked.achievements_count, ranked.total_points,
    case ranked.period_type
      when 'week' then 'За текущую неделю'
      when 'month' then 'За текущий месяц'
      when 'quarter' then 'За текущую четверть'
      when 'all_time' then 'За всё время'
      else 'За текущий учебный год'
    end,
    ranked.top_count
  from ranked
  where ranked.display_number <= ranked.top_count
  order by ranked.group_key, ranked.display_number;
$function$
language sql security definer set search_path = public stable;

revoke all on function public.get_screen_leaderboard(uuid) from public;
grant execute on function public.get_screen_leaderboard(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
