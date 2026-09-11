import "server-only";

import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BannerWithClicks,
  ClickMetrics,
  MetricsPeriod,
} from "@/types/click-metrics";
import type { Banner } from "@/types/banner";

const emptyMetrics = (period: MetricsPeriod): ClickMetrics => ({
  today: 0,
  yesterday: 0,
  last7: 0,
  previous7: 0,
  last30: 0,
  previous30: 0,
  total: 0,
  series: Array.from({ length: period }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (period - index - 1));
    return { date: date.toISOString().slice(0, 10), clicks: 0 };
  }),
  ranking: [],
});

export async function getClickMetrics(period: MetricsPeriod) {
  await requireAdminSession();
  const { data, error } = await createAdminClient().rpc(
    "get_banner_click_metrics",
    { period_days: period },
  );
  if (error)
    throw new Error("Não foi possível carregar as métricas de clique.");
  return data ? (data as ClickMetrics) : emptyMetrics(period);
}

export async function addClickCounts(
  banners: Banner[],
): Promise<BannerWithClicks[]> {
  await requireAdminSession();
  const { data, error } = await createAdminClient().rpc(
    "get_banner_click_counts",
  );
  if (error)
    throw new Error("Não foi possível carregar os cliques dos banners.");
  const counts = new Map(
    ((data ?? []) as { banner_id: string; click_count: number | string }[]).map(
      (item) => [item.banner_id, Number(item.click_count)],
    ),
  );
  return banners.map((banner) => ({
    ...banner,
    click_count: counts.get(banner.id) ?? 0,
  }));
}
