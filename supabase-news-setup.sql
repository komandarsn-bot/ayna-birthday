-- Таблица новостей
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 2000),
  image_path text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;

drop policy if exists "news_owner_select" on public.news;
create policy "news_owner_select" on public.news
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "news_owner_insert" on public.news;
create policy "news_owner_insert" on public.news
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "news_owner_update" on public.news;
create policy "news_owner_update" on public.news
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "news_owner_delete" on public.news;
create policy "news_owner_delete" on public.news
  for delete to authenticated using (auth.uid() = user_id);

-- Публичная папка: новости предназначены для показа на телевизоре.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images', 'news-images', true, 8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "news_images_owner_insert" on storage.objects;
create policy "news_images_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'news-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "news_images_owner_delete" on storage.objects;
create policy "news_images_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'news-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Публичный ТВ-экран получает только опубликованные новости владельца ссылки.
create or replace function public.get_screen_news(p_access_token uuid)
returns table (
  news_id uuid,
  news_title text,
  news_body text,
  news_image_path text,
  news_created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select n.id, n.title, n.body, n.image_path, n.created_at
  from public.screens s
  join public.news n on n.user_id = s.user_id
  where s.access_token = p_access_token
    and n.is_published = true
  order by n.created_at desc, n.id desc
  limit 10;
$$;

revoke all on function public.get_screen_news(uuid) from public;
grant execute on function public.get_screen_news(uuid) to anon, authenticated;
