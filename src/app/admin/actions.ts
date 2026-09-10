"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";
import { clearAdminSession, requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { bannerSchema } from "@/lib/validation";

async function adminClient() {
  await requireAdminSession();
  return createAdminClient();
}

const text = (data: FormData, key: string) =>
  String(data.get(key) || "").trim();
const toUtc = (value: string) =>
  value ? fromZonedTime(value, "America/Sao_Paulo").toISOString() : null;

function refreshBannerPages() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/banners");
  revalidatePath("/admin/programacoes");
}

export async function saveBanner(data: FormData) {
  const supabase = await adminClient();
  const id = text(data, "id");
  const oldImageUrl = text(data, "existing_image_url");
  const oldImagePath = text(data, "existing_image_path") || null;
  const parsed = bannerSchema.safeParse({
    internal_name: text(data, "internal_name"),
    destination_url: text(data, "destination_url"),
    alt_text: text(data, "alt_text"),
    enabled: data.get("enabled") === "on",
    open_new_tab: data.get("open_new_tab") === "on",
    publish_at: text(data, "publish_at"),
    unpublish_at: text(data, "unpublish_at"),
  });
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message || "Revise os campos.");

  let imageUrl = oldImageUrl;
  let imagePath = oldImagePath;
  let uploadedPath: string | null = null;
  const file = data.get("image");

  if (file instanceof File && file.size) {
    if (file.size > 8 * 1024 * 1024)
      throw new Error("A imagem deve ter no máximo 8 MB.");
    if (
      !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(
        file.type,
      )
    )
      throw new Error("Envie PNG, JPG, WEBP ou AVIF.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    uploadedPath = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("banners")
      .upload(uploadedPath, file, { contentType: file.type });
    if (error)
      throw new Error("Não foi possível enviar a imagem. Tente novamente.");
    imagePath = uploadedPath;
    imageUrl = supabase.storage.from("banners").getPublicUrl(uploadedPath)
      .data.publicUrl;
  }
  if (!imageUrl) throw new Error("Selecione uma imagem.");

  const payload = {
    internal_name: parsed.data.internal_name,
    image_url: imageUrl,
    image_path: imagePath,
    destination_url: parsed.data.destination_url || null,
    alt_text: parsed.data.alt_text || null,
    enabled: parsed.data.enabled,
    open_new_tab: parsed.data.open_new_tab,
    publish_at: toUtc(parsed.data.publish_at),
    unpublish_at: toUtc(parsed.data.unpublish_at),
  };

  let databaseError = null;
  if (id) {
    const result = await supabase.from("banners").update(payload).eq("id", id);
    databaseError = result.error;
  } else {
    const { data: last } = await supabase
      .from("banners")
      .select("sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const result = await supabase
      .from("banners")
      .insert({ ...payload, sort_order: (last?.sort_order ?? -1) + 1 });
    databaseError = result.error;
  }

  if (databaseError) {
    if (uploadedPath)
      await supabase.storage.from("banners").remove([uploadedPath]);
    throw new Error(
      id
        ? "Não foi possível salvar as alterações. Tente novamente."
        : "Não foi possível criar o banner. Tente novamente.",
    );
  }

  if (id && uploadedPath && oldImagePath && oldImagePath !== uploadedPath) {
    const { count } = await supabase
      .from("banners")
      .select("id", { count: "exact", head: true })
      .eq("image_path", oldImagePath)
      .neq("id", id)
      .is("deleted_at", null);
    if ((count ?? 0) === 0)
      await supabase.storage.from("banners").remove([oldImagePath]);
  }

  refreshBannerPages();
  redirect(`/admin/banners?saved=${id ? "updated" : "created"}`);
}

export async function toggleBanner(id: string, enabled: boolean) {
  const { error } = await (
    await adminClient()
  )
    .from("banners")
    .update({ enabled })
    .eq("id", id)
    .is("deleted_at", null);
  if (error)
    throw new Error("Não foi possível alterar o banner. Tente novamente.");
  refreshBannerPages();
}

export async function duplicateBanner(id: string) {
  const supabase = await adminClient();
  const { data, error } = await supabase
    .from("banners")
    .select(
      "internal_name,image_url,image_path,destination_url,alt_text,publish_at,unpublish_at,open_new_tab",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new Error("Banner não encontrado.");
  const { data: last } = await supabase
    .from("banners")
    .select("sort_order")
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const result = await supabase.from("banners").insert({
    ...data,
    internal_name: `${data.internal_name} — cópia`,
    enabled: false,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (result.error) throw new Error("Não foi possível duplicar o banner.");
  refreshBannerPages();
}

export async function deleteBanner(id: string) {
  const { error } = await (
    await adminClient()
  )
    .from("banners")
    .update({ deleted_at: new Date().toISOString(), enabled: false })
    .eq("id", id);
  if (error) throw new Error("Não foi possível excluir o banner.");
  refreshBannerPages();
}

export async function reorderBanners(ids: string[]) {
  const supabase = await adminClient();
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error("A ordem enviada é inválida.");
  const { error } = await supabase.rpc("reorder_banners", { banner_ids: ids });
  if (error) throw new Error("Não foi possível salvar a nova ordem.");
  refreshBannerPages();
}

export async function logout() {
  await clearAdminSession();
  redirect("/login");
}
