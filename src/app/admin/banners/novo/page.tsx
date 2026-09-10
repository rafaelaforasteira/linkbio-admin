import { BannerForm } from "@/components/banner-form";
import { hasAdminSupabaseEnv, isAdminPreviewMode } from "@/lib/env";
import "../form.css";
export default function NewBanner() {
  const previewMode = isAdminPreviewMode() && !hasAdminSupabaseEnv();
  return (
    <>
      <div className="page-title">
        <div>
          <h1 className="serif">Novo banner</h1>
          <p>Adicione uma arte pronta e defina quando ela será exibida.</p>
        </div>
      </div>
      <BannerForm previewMode={previewMode} />
    </>
  );
}
