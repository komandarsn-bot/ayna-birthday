-- Выполните один раз в Supabase: SQL Editor -> New query -> Run.
-- Добавляет настраиваемую шкалу баллов и пересчёт существующих достижений.

create table if not exists public.achievement_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  event_stage text not null check (event_stage in (
    'школьный', 'районный', 'городской', 'республиканский', 'международный'
  )),
  result_category text not null check (result_category in (
    '1 место / абсолютный чемпион', '2 место', '3 место',
    'номинация / грамота', 'сертификат'
  )),
  points smallint not null check (points between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_stage, result_category)
);

alter table public.achievement_scoring_rules enable row level security;

drop policy if exists "achievement_scoring_rules_owner_select" on public.achievement_scoring_rules;
create policy "achievement_scoring_rules_owner_select" on public.achievement_scoring_rules
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "achievement_scoring_rules_owner_insert" on public.achievement_scoring_rules;
create policy "achievement_scoring_rules_owner_insert" on public.achievement_scoring_rules
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "achievement_scoring_rules_owner_update" on public.achievement_scoring_rules;
create policy "achievement_scoring_rules_owner_update" on public.achievement_scoring_rules
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "achievement_scoring_rules_owner_delete" on public.achievement_scoring_rules;
create policy "achievement_scoring_rules_owner_delete" on public.achievement_scoring_rules
  for delete to authenticated using (auth.uid() = user_id);

alter table public.student_achievement_points
  drop constraint if exists student_achievement_points_points_check;
alter table public.student_achievement_points
  add constraint student_achievement_points_points_check check (points between 0 and 1000);

drop function if exists public.calculate_achievement_points(text, text);
create or replace function public.calculate_achievement_points(p_user_id uuid, p_stage text, p_result text)
returns smallint
as $function$
  with normalized as (
    select lower(trim(p_stage)) as stage,
           public.achievement_result_category(p_result) as category
  ), defaults as (
    select stage, category,
      (case stage
        when 'школьный' then 5 when 'районный' then 6 when 'городской' then 8
        when 'республиканский' then 12 when 'международный' then 16
        else null
      end - case category
        when '1 место / абсолютный чемпион' then 0 when '2 место' then 1
        when '3 место' then 2 when 'номинация / грамота' then 3
        when 'сертификат' then 4 else null
      end)::smallint as default_points
    from normalized
  )
  select coalesce(rule.points, defaults.default_points)::smallint
  from defaults
  left join public.achievement_scoring_rules rule
    on rule.user_id = p_user_id
   and rule.event_stage = defaults.stage
   and rule.result_category = defaults.category;
$function$
language sql
stable
security definer
set search_path = public;

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
  calculated_points := public.calculate_achievement_points(new.user_id, new.event_stage, new.result);
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
    user_id = excluded.user_id, student_id = excluded.student_id,
    event_stage = excluded.event_stage, result_name = excluded.result_name,
    result_category = excluded.result_category, points = excluded.points,
    updated_at = now();
  return new;
end;
$function$
language plpgsql security definer set search_path = public;

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
    public.calculate_achievement_points(achievement.user_id, achievement.event_stage, achievement.result), now()
  from public.achievements achievement
  where achievement.user_id = current_user_id
    and achievement.student_id is not null
    and public.calculate_achievement_points(achievement.user_id, achievement.event_stage, achievement.result) is not null;
end;
$function$
language plpgsql security definer set search_path = public;

revoke all on function public.recalculate_my_achievement_points() from public;
grant execute on function public.recalculate_my_achievement_points() to authenticated;
