-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.
create table if not exists public.achievement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.achievement_results enable row level security;

drop policy if exists "achievement_results_owner_all" on public.achievement_results;
create policy "achievement_results_owner_all" on public.achievement_results
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- После следующего входа в админ-панель стартовые результаты
-- будут добавлены автоматически для текущего пользователя.
