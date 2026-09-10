create extension if not exists pgcrypto;
create table public.banners (
  id uuid primary key default gen_random_uuid(), internal_name text not null check (char_length(trim(internal_name)) >= 2),
  image_url text not null, image_path text, destination_url text check (destination_url is null or destination_url ~* '^https?://'),
  alt_text text, sort_order integer not null default 0 check (sort_order >= 0), enabled boolean not null default false,
  publish_at timestamptz, unpublish_at timestamptz, open_new_tab boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint banners_valid_window check (publish_at is null or unpublish_at is null or unpublish_at > publish_at)
);
create index banners_public_order_idx on public.banners (sort_order) where enabled = true and deleted_at is null;
create index banners_publish_at_idx on public.banners (publish_at) where deleted_at is null;
create index banners_unpublish_at_idx on public.banners (unpublish_at) where deleted_at is null;
create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger banners_set_updated_at before update on public.banners for each row execute function public.set_updated_at();
alter table public.banners enable row level security;
create policy "Public can read currently visible banners" on public.banners for select to anon using (enabled and deleted_at is null and (publish_at is null or publish_at <= now()) and (unpublish_at is null or unpublish_at > now()));
create policy "Authenticated users can read banners" on public.banners for select to authenticated using (true);
create policy "Authenticated users can create banners" on public.banners for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated users can update banners" on public.banners for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated users can delete banners" on public.banners for delete to authenticated using (auth.uid() is not null);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('banners','banners',true,8388608,array['image/png','image/jpeg','image/webp','image/avif']) on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public can view banner images" on storage.objects for select to public using (bucket_id='banners');
create policy "Authenticated users can upload banner images" on storage.objects for insert to authenticated with check (bucket_id='banners' and auth.uid() is not null);
create policy "Authenticated users can update banner images" on storage.objects for update to authenticated using (bucket_id='banners' and auth.uid() is not null) with check (bucket_id='banners' and auth.uid() is not null);
create policy "Authenticated users can delete banner images" on storage.objects for delete to authenticated using (bucket_id='banners' and auth.uid() is not null);
