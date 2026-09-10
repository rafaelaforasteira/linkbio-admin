import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BannerForm } from "@/components/banner-form";
import type { Banner } from "@/types/banner";
import { hasSupabaseEnv, isAdminPreviewMode } from "@/lib/env";
import { getAdminPreviewBanners } from "@/lib/admin-preview-banners";
import "../form.css";
export default async function EditBanner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mockMode = isAdminPreviewMode() && !hasSupabaseEnv();
  if (mockMode) {
    const mockBanner = getAdminPreviewBanners().find(
      (banner) => banner.id === id,
    );
    if (!mockBanner) notFound();
    return (
      <>
        <div className="page-title">
          <div>
            <h1 className="serif">Editar banner</h1>
            <p>
              Teste a edição visual. Alterações não são persistidas no modo de
              visualização.
            </p>
          </div>
        </div>
        <BannerForm banner={mockBanner} previewMode />
      </>
    );
  }
  const { data } = await (await createClient())
    .from("banners")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!data) notFound();
  return (
    <>
      <div className="page-title">
        <div>
          <h1 className="serif">Editar banner</h1>
          <p>As alterações só entram em vigor depois de salvar.</p>
        </div>
      </div>
      <BannerForm banner={data as Banner} />
    </>
  );
}
