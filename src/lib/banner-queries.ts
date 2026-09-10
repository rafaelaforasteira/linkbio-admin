import type { Banner } from "@/types/banner";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { hasPublicSupabaseEnv } from "@/lib/env";

export async function getAllBanners(): Promise<Banner[]> {
  await requireAdminSession();
  const { data, error } = await createAdminClient()
    .from("banners")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw new Error("Não foi possível carregar os banners.");
  return (data ?? []) as Banner[];
}

export async function getPublicBanners(): Promise<Banner[]> {
  if (!hasPublicSupabaseEnv()) return [];
  const now = new Date().toISOString();
  const { data, error } = await createPublicClient()
    .from("banners")
    .select("*")
    .eq("enabled", true)
    .is("deleted_at", null)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)
    .order("sort_order");
  if (error) throw new Error("Não foi possível carregar esta Link Bio.");
  return (data ?? []) as Banner[];
}
