-- Выполните этот файл один раз в Supabase: SQL Editor -> New query -> Run.
alter table public.achievements
  add column if not exists event_end_date date;

alter table public.achievements
  drop constraint if exists achievements_event_date_range_check;

alter table public.achievements
  add constraint achievements_event_date_range_check
  check (
    event_end_date is null
    or event_date is null
    or event_end_date >= event_date
  );
