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
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

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
grant execute on function public.reorder_banners(uuid[]) to authenticated;
