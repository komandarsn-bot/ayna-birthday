-- Демонстрационное заполнение базы достижений.
-- Добавляет 30 реалистичных записей для существующих учеников.
-- Запустите один раз целиком: Supabase -> SQL Editor -> New query -> Run.

do $$
declare
  owner_id uuid;
  students_count integer;
begin
  select id into owner_id
  from auth.users
  where lower(email) = lower('rus11999944@gmail.com')
  limit 1;

  if owner_id is null then
    raise exception 'Пользователь admin не найден';
  end if;

  select count(*) into students_count
  from public.students
  where user_id = owner_id;

  if students_count = 0 then
    raise exception 'Сначала загрузите учеников в базу школы';
  end if;

  with student_pool as (
    select
      student.*,
      row_number() over (order by md5(student.id::text)) as row_number
    from public.students student
    where student.user_id = owner_id
  ), demo_number as (
    select number
    from generate_series(1, 30) as series(number)
  ), prepared as (
    select
      number.number,
      student.id as student_id,
      student.last_name,
      student.first_name,
      student.class_name,
      event.id as event_id,
      coalesce(event.name, 'Школьное образовательное мероприятие') as event_name,
      subject.id as subject_id,
      subject.name as subject_name,
      order_item.name as order_name,
      type_item.name as type_name,
      teacher.last_name as teacher_last_name,
      teacher.first_name as teacher_first_name,
      organizer.name as organizer_name,
      country.name as country_name,
      city.name as city_name
    from demo_number number
    cross join lateral (
      select * from student_pool
      where row_number = ((number.number - 1) % students_count) + 1
    ) student
    left join lateral (
      select * from public.achievement_events item
      where item.user_id = owner_id
      order by md5(item.id::text || number.number::text)
      limit 1
    ) event on true
    left join lateral (
      select * from public.achievement_subjects item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 3)::text)
      limit 1
    ) subject on true
    left join lateral (
      select * from public.achievement_orders item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 5)::text)
      limit 1
    ) order_item on true
    left join lateral (
      select * from public.achievement_types item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 7)::text)
      limit 1
    ) type_item on true
    left join lateral (
      select * from public.teachers item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 11)::text)
      limit 1
    ) teacher on true
    left join lateral (
      select * from public.achievement_organizers item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 13)::text)
      limit 1
    ) organizer on true
    left join lateral (
      select * from public.achievement_countries item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 17)::text)
      limit 1
    ) country on true
    left join lateral (
      select * from public.achievement_cities item
      where item.user_id = owner_id
      order by md5(item.id::text || (number.number * 19)::text)
      limit 1
    ) city on true
  )
  insert into public.achievements (
    user_id, student_id, event_id, subject_id,
    last_name, first_name, class_name, event_name,
    order_reference, cost, subject, achievement_level, event_stage,
    project_name, academic_type, event_format, result,
    supervisor_name, organizers, event_date, event_end_date,
    link_url, country, city
  )
  select
    owner_id,
    prepared.student_id,
    prepared.event_id,
    prepared.subject_id,
    prepared.last_name,
    prepared.first_name,
    prepared.class_name,
    prepared.event_name,
    case when prepared.number % 3 = 0 then prepared.order_name else null end,
    case when prepared.number % 4 = 0 then (3000 + prepared.number * 250)::numeric else null end,
    case when prepared.number % 5 = 0 then null else prepared.subject_name end,
    (array['Школьный','Районный','Городской','Республиканский','Международный'])[((prepared.number * 3) % 5) + 1],
    (array['Школьный','Районный','Городской','Республиканский','Международный'])[((prepared.number * 3) % 5) + 1],
    coalesce(prepared.type_name, (array['Олимпиада','Конкурс','Турнир','Хакатон'])[(prepared.number % 4) + 1]),
    case when prepared.number % 4 = 0 then 'NON ACADEMIC' else 'ACADEMIC' end,
    case when prepared.number % 5 = 0 then 'Онлайн' else 'Офлайн' end,
    (array['1 место','2 место','3 место','Почётная грамота','Сертификат','Благодарственное письмо'])[(prepared.number % 6) + 1],
    coalesce(nullif(concat_ws(' ', prepared.teacher_last_name, prepared.teacher_first_name), ''), 'Администрация школы'),
    coalesce(prepared.organizer_name, 'Школа Ayna'),
    current_date - (prepared.number * 6),
    current_date - (prepared.number * 6) + (prepared.number % 3),
    null,
    coalesce(prepared.country_name, 'Казахстан'),
    coalesce(prepared.city_name, 'Астана')
  from prepared;

  raise notice 'Добавлено 30 демонстрационных достижений';
end;
$$ language plpgsql;
