create table public.banner_clicks (
  id uuid primary key default gen_random_uuid(),
  banner_id uuid not null references public.banners(id),
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

create index banner_clicks_banner_id_idx on public.banner_clicks (banner_id);
create index banner_clicks_clicked_at_idx on public.banner_clicks (clicked_at);
create index banner_clicks_banner_clicked_at_idx on public.banner_clicks (banner_id, clicked_at);

alter table public.banner_clicks enable row level security;

revoke all on public.banner_clicks from anon, authenticated;

create or replace function public.get_banner_click_counts()
returns table (banner_id uuid, click_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select clicks.banner_id, count(*)::bigint as click_count
  from public.banner_clicks as clicks
  group by clicks.banner_id;
$$;

create or replace function public.get_banner_click_metrics(period_days integer default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  safe_period integer := case when period_days in (7, 30, 90) then period_days else 30 end;
  today_start timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  result jsonb;
begin
  select jsonb_build_object(
    'today', (select count(*) from public.banner_clicks where clicked_at >= today_start and clicked_at < today_start + interval '1 day'),
    'yesterday', (select count(*) from public.banner_clicks where clicked_at >= today_start - interval '1 day' and clicked_at < today_start),
    'last7', (select count(*) from public.banner_clicks where clicked_at >= now() - interval '7 days'),
    'previous7', (select count(*) from public.banner_clicks where clicked_at >= now() - interval '14 days' and clicked_at < now() - interval '7 days'),
    'last30', (select count(*) from public.banner_clicks where clicked_at >= now() - interval '30 days'),
    'previous30', (select count(*) from public.banner_clicks where clicked_at >= now() - interval '60 days' and clicked_at < now() - interval '30 days'),
    'total', (select count(*) from public.banner_clicks),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('date', days.day, 'clicks', coalesce(counts.clicks, 0)) order by days.day), '[]'::jsonb)
      from generate_series(
        (today_start at time zone 'America/Sao_Paulo')::date - (safe_period - 1),
        (today_start at time zone 'America/Sao_Paulo')::date,
        interval '1 day'
      ) as days(day)
      left join (
        select (clicked_at at time zone 'America/Sao_Paulo')::date as day, count(*) as clicks
        from public.banner_clicks
        where clicked_at >= today_start - make_interval(days => safe_period - 1)
        group by 1
      ) as counts on counts.day = days.day
    ),
    'ranking', (
      select coalesce(jsonb_agg(to_jsonb(ranked) order by ranked.clicks desc), '[]'::jsonb)
      from (
        select banners.id, banners.internal_name, banners.image_url, banners.enabled,
          banners.publish_at, banners.unpublish_at, count(clicks.id)::bigint as clicks
        from public.banner_clicks as clicks
        join public.banners as banners on banners.id = clicks.banner_id
        where clicks.clicked_at >= now() - make_interval(days => safe_period)
        group by banners.id
        order by clicks desc
        limit 5
      ) as ranked
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.get_banner_click_counts() from public, anon, authenticated;
revoke all on function public.get_banner_click_metrics(integer) from public, anon, authenticated;
grant execute on function public.get_banner_click_counts() to service_role;
grant execute on function public.get_banner_click_metrics(integer) to service_role;
