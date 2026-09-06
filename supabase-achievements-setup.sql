-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.
create table if not exists public.achievement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 300),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievement_cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  student_id uuid references public.students(id) on delete set null,
  event_id uuid references public.achievement_events(id) on delete set null,
  subject_id uuid references public.achievement_subjects(id) on delete set null,
  last_name text not null,
  first_name text not null,
  class_name text not null,
  event_name text not null,
  order_reference text,
  cost numeric(12, 2) check (cost is null or cost >= 0),
  subject text,
  achievement_level text,
  event_stage text,
  project_name text,
  academic_type text check (academic_type is null or academic_type in ('ACADEMIC', 'NON ACADEMIC')),
  event_format text,
  result text,
  supervisor_name text,
  organizers text,
  event_date date,
  event_end_date date,
  link_url text,
  city text,
  created_at timestamptz not null default now()
);

-- Связь с общей базой учеников для уже созданной таблицы достижений.
alter table public.achievements
  add column if not exists student_id uuid references public.students(id) on delete set null;
alter table public.achievements
  add column if not exists event_id uuid references public.achievement_events(id) on delete set null;
alter table public.achievements
  add column if not exists subject_id uuid references public.achievement_subjects(id) on delete set null;
alter table public.achievements
  add column if not exists event_end_date date;
alter table public.achievements
  add column if not exists country text;

alter table public.achievements
  drop constraint if exists achievements_event_date_range_check;
alter table public.achievements
  add constraint achievements_event_date_range_check
  check (
    event_end_date is null
    or event_date is null
    or event_end_date >= event_date
  );

create index if not exists achievements_student_id_idx
  on public.achievements (student_id);
create index if not exists achievements_event_id_idx
  on public.achievements (event_id);
create index if not exists achievements_subject_id_idx
  on public.achievements (subject_id);

create index if not exists achievements_user_event_date_idx
  on public.achievements (user_id, event_date desc);

alter table public.achievements enable row level security;
alter table public.achievement_events enable row level security;
alter table public.achievement_subjects enable row level security;
alter table public.achievement_types enable row level security;
alter table public.achievement_results enable row level security;
alter table public.achievement_orders enable row level security;
alter table public.achievement_countries enable row level security;
alter table public.achievement_cities enable row level security;

drop policy if exists "achievement_events_owner_all" on public.achievement_events;
create policy "achievement_events_owner_all" on public.achievement_events
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievement_subjects_owner_all" on public.achievement_subjects;
create policy "achievement_subjects_owner_all" on public.achievement_subjects
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.achievement_subjects (user_id, name)
select users.id, subjects.name
from auth.users as users
cross join (values
  ('Әліппе'), ('Ана тілі'), ('Әдебиеттік оқу'),
  ('Казахский язык'), ('Казахская литература'), ('Казахский язык и литература'),
  ('Русский язык'), ('Русская литература'), ('Русский язык и литература'),
  ('Английский язык'), ('Иностранный язык'), ('Математика'), ('Алгебра'),
  ('Геометрия'), ('Естествознание'), ('Физика'), ('Химия'), ('Биология'),
  ('География'), ('Познание мира'), ('История Казахстана'), ('Всемирная история'),
  ('Основы права'), ('Цифровая грамотность и искусственный интеллект'),
  ('Информатика и искусственный интеллект'), ('Художественный труд'), ('Музыка'),
  ('Физическая культура'), ('Начальная военная и технологическая подготовка')
) as subjects(name)
on conflict (user_id, name) do nothing;

drop policy if exists "achievement_types_owner_all" on public.achievement_types;
create policy "achievement_types_owner_all" on public.achievement_types
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievement_results_owner_all" on public.achievement_results;
create policy "achievement_results_owner_all" on public.achievement_results
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievement_orders_owner_all" on public.achievement_orders;
create policy "achievement_orders_owner_all" on public.achievement_orders
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievement_countries_owner_all" on public.achievement_countries;
create policy "achievement_countries_owner_all" on public.achievement_countries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievement_cities_owner_all" on public.achievement_cities;
create policy "achievement_cities_owner_all" on public.achievement_cities
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievements_owner_select" on public.achievements;
create policy "achievements_owner_select" on public.achievements
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "achievements_owner_insert" on public.achievements;
create policy "achievements_owner_insert" on public.achievements
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "achievements_owner_update" on public.achievements;
create policy "achievements_owner_update" on public.achievements
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "achievements_owner_delete" on public.achievements;
create policy "achievements_owner_delete" on public.achievements
  for delete to authenticated
  using (auth.uid() = user_id);
