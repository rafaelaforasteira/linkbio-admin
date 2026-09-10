drop policy if exists "Authenticated users can read banners" on public.banners;
drop policy if exists "Authenticated users can create banners" on public.banners;
drop policy if exists "Authenticated users can update banners" on public.banners;
drop policy if exists "Authenticated users can delete banners" on public.banners;

drop policy if exists "Authenticated users can upload banner images" on storage.objects;
drop policy if exists "Authenticated users can update banner images" on storage.objects;
drop policy if exists "Authenticated users can delete banner images" on storage.objects;

create or replace function public.reorder_banners(banner_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  banner_id uuid;
  banner_position integer := 0;
begin
  foreach banner_id in array banner_ids loop
    update public.banners
      set sort_order = banner_position
      where id = banner_id and deleted_at is null;
    if not found then
      raise exception 'banner not found';
    end if;
    banner_position := banner_position + 1;
  end loop;
end;
$$;

revoke all on function public.reorder_banners(uuid[]) from public;
revoke all on function public.reorder_banners(uuid[]) from authenticated;
grant execute on function public.reorder_banners(uuid[]) to service_role;
