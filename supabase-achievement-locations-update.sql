-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.
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

alter table public.achievements add column if not exists country text;
alter table public.achievement_countries enable row level security;
alter table public.achievement_cities enable row level security;

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
