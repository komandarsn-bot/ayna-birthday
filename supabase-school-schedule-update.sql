-- Выполните один раз в Supabase: SQL Editor -> New query -> Run.
-- Хранит расписание смен по дням недели и безопасно выдаёт его ТВ-экрану.

create table if not exists public.school_schedule_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  shift_count smallint not null default 2 check (shift_count between 1 and 3),
  schedules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.school_schedule_settings enable row level security;
drop policy if exists "school_schedule_settings_owner_all" on public.school_schedule_settings;
create policy "school_schedule_settings_owner_all"
on public.school_schedule_settings
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop function if exists public.get_screen_schedule(uuid);
create function public.get_screen_schedule(p_access_token uuid)
returns table (shift_count smallint, schedules jsonb)
as $function$
  select setting.shift_count, setting.schedules
  from public.screens screen
  join public.school_schedule_settings setting on setting.user_id = screen.user_id
  where screen.access_token = p_access_token
  limit 1;
$function$
language sql
security definer
set search_path = public
stable;

revoke all on function public.get_screen_schedule(uuid) from public;
grant execute on function public.get_screen_schedule(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
