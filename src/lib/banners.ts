import type { Banner, BannerStatus } from "@/types/banner";

export function bannerStatus(banner: Banner, now = new Date()): BannerStatus {
  if (!banner.enabled) return "hidden";
  if (banner.publish_at && new Date(banner.publish_at) > now)
    return "scheduled";
  if (banner.unpublish_at && new Date(banner.unpublish_at) <= now)
    return "ended";
  return "published";
}

export function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function safeAdminPath(value: string | null) {
  if (!value || !value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//") || value.includes(":") || value.includes("\\"))
    return "/admin";
  return value;
}
