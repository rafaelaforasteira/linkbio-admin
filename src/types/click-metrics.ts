import type { Banner } from "@/types/banner";

export type MetricsPeriod = 7 | 30 | 90;
export type BannerWithClicks = Banner & { click_count: number };
export type ClickSeriesPoint = { date: string; clicks: number };
export type ClickRankingItem = Pick<
  Banner,
  | "id"
  | "internal_name"
  | "image_url"
  | "enabled"
  | "publish_at"
  | "unpublish_at"
> & { clicks: number };

export type ClickMetrics = {
  today: number;
  yesterday: number;
  last7: number;
  previous7: number;
  last30: number;
  previous30: number;
  total: number;
  series: ClickSeriesPoint[];
  ranking: ClickRankingItem[];
};
