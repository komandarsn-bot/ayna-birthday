-- Объединяет визуально одинаковые латинские и кириллические буквы классов.
-- Например, «6 А», «6 A» и «6А» становятся «6 A».
-- Если после нормализации совпадут записи одного ученика или обнаружатся
-- разные смены для одного класса, транзакция остановится без изменений.

begin;

create or replace function public.normalize_school_class_name(p_class text)
returns text
language sql
immutable
as $function$
  with parsed as (
    select regexp_match(btrim(p_class), '^([0-9]{1,2})[[:space:]]*([^[:space:]])$') as parts
  )
  select case
    when parts is not null then
      ((parts)[1]::integer)::text || ' ' ||
      translate(upper((parts)[2]), 'АВСЕНКМОРТХУ', 'ABCEHKMOPTXY')
    else regexp_replace(btrim(p_class), '[[:space:]]+', ' ', 'g')
  end
  from parsed;
$function$;

do $block$
begin
  if exists (
    select 1
    from public.students
    group by user_id, last_name, first_name,
      public.normalize_school_class_name(class_name)
    having count(*) > 1
  ) then
    raise exception 'После объединения букв появятся дубликаты учеников. Нужна ручная проверка этих записей.';
  end if;

  if exists (
    select 1
    from public.screen_leaderboard_settings settings
    cross join lateral jsonb_each_text(coalesce(settings.class_shift_map, '{}'::jsonb)) as entry(key, value)
    group by settings.user_id, public.normalize_school_class_name(entry.key)
    having count(distinct entry.value) > 1
  ) then
    raise exception 'У одного класса указаны разные смены для латинской и кириллической буквы. Сначала устраните противоречие.';
  end if;
end;
$block$;

update public.students
set class_name = public.normalize_school_class_name(class_name)
where class_name is distinct from public.normalize_school_class_name(class_name);

update public.achievements
set class_name = public.normalize_school_class_name(class_name)
where class_name is distinct from public.normalize_school_class_name(class_name);

update public.screen_leaderboard_settings settings
set class_shift_map = coalesce((
  select jsonb_object_agg(public.normalize_school_class_name(entry.key), entry.value)
  from jsonb_each(coalesce(settings.class_shift_map, '{}'::jsonb)) as entry(key, value)
), '{}'::jsonb);

update public.screen_leaderboard_settings settings
set selected_groups = coalesce((
  select jsonb_agg(distinct public.normalize_school_class_name(entry.value))
  from jsonb_array_elements_text(coalesce(settings.selected_groups, '[]'::jsonb)) as entry(value)
), '[]'::jsonb)
where settings.group_mode = 'class';

create or replace function public.normalize_school_class_name_on_write()
returns trigger
language plpgsql
as $function$
begin
  new.class_name := public.normalize_school_class_name(new.class_name);
  return new;
end;
$function$;

drop trigger if exists normalize_student_class_name on public.students;
create trigger normalize_student_class_name
before insert or update of class_name on public.students
for each row execute function public.normalize_school_class_name_on_write();

drop trigger if exists normalize_achievement_class_name on public.achievements;
create trigger normalize_achievement_class_name
before insert or update of class_name on public.achievements
for each row execute function public.normalize_school_class_name_on_write();

commit;

notify pgrst, 'reload schema';
