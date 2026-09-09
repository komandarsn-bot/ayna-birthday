-- Переключатели разделов телевизионного экрана.
-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.

alter table public.screen_leaderboard_settings
  add column if not exists show_birthdays boolean not null default true;

alter table public.screen_leaderboard_settings
  add column if not exists show_announcements boolean not null default true;

alter table public.screen_leaderboard_settings
  add column if not exists show_events boolean not null default true;

create or replace function public.get_screen_content_settings(p_access_token uuid)
returns table (
  show_birthdays boolean,
  show_announcements boolean,
  show_events boolean,
  show_leaderboard boolean
)
language sql
security definer
set search_path = public
stable
as $function$
  select
    coalesce(setting.show_birthdays, true),
    coalesce(setting.show_announcements, true),
    coalesce(setting.show_events, true),
    coalesce(setting.is_enabled, true)
  from public.screens screen
  left join public.screen_leaderboard_settings setting
    on setting.user_id = screen.user_id
  where screen.access_token = p_access_token
  limit 1;
$function$;

revoke all on function public.get_screen_content_settings(uuid) from public;
grant execute on function public.get_screen_content_settings(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
