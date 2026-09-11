import type { Banner } from "@/types/banner";
import type {
  BannerWithClicks,
  ClickMetrics,
  MetricsPeriod,
} from "@/types/click-metrics";

const previewCounts: Record<string, number> = {
  "mock-catalogo": 2486,
  "mock-vip": 1927,
  "mock-live": 1311,
  "mock-estoque": 894,
  "mock-golden": 0,
  "mock-antiga": 7803,
};

export function withAdminPreviewClicks(banners: Banner[]): BannerWithClicks[] {
  return banners.map((banner) => ({
    ...banner,
    click_count: previewCounts[banner.id] ?? 0,
  }));
}

export function getAdminPreviewMetrics(
  banners: Banner[],
  period: MetricsPeriod,
  now = new Date(),
): ClickMetrics {
  const series = Array.from({ length: period }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (period - index - 1));
    const wave = Math.sin(index * 0.72) * 36;
    const trend = index * 1.7;
    return {
      date: date.toISOString().slice(0, 10),
      clicks: Math.max(24, Math.round(92 + wave + trend)),
    };
  });
  const byId = new Map(banners.map((banner) => [banner.id, banner]));
  const rankingIds = ["mock-catalogo", "mock-vip", "mock-live", "mock-estoque"];
  return {
    today: 184,
    yesterday: 157,
    last7: 1247,
    previous7: 1053,
    last30: 5892,
    previous30: 5320,
    total: 18421,
    series,
    ranking: rankingIds.flatMap((id) => {
      const banner = byId.get(id);
      return banner
        ? [
            {
              id: banner.id,
              internal_name: banner.internal_name,
              image_url: banner.image_url,
              enabled: banner.enabled,
              publish_at: banner.publish_at,
              unpublish_at: banner.unpublish_at,
              clicks: Math.round((previewCounts[id] * period) / 30),
            },
          ]
        : [];
    }),
  };
}
