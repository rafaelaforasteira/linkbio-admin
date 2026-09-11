import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getAllBanners } from "@/lib/banner-queries";
import { BannerList } from "@/components/banner-list";
import { SavedFeedback } from "@/components/saved-feedback";
import { hasAdminSupabaseEnv, isAdminPreviewMode } from "@/lib/env";
import { getAdminPreviewBanners } from "@/lib/admin-preview-banners";
import { withAdminPreviewClicks } from "@/lib/admin-preview-metrics";
import { addClickCounts } from "@/lib/click-metrics";
import "./banners.css";

export default async function BannersPage() {
  const mockMode = isAdminPreviewMode() && !hasAdminSupabaseEnv();
  const banners = mockMode
    ? withAdminPreviewClicks(getAdminPreviewBanners())
    : await addClickCounts(await getAllBanners());
  return (
    <>
      <Suspense>
        <SavedFeedback />
      </Suspense>
      <div className="page-title">
        <div>
          <h1 className="serif">Banners</h1>
          <p>Gerencie tudo que aparece na sua Link Bio.</p>
        </div>
        <div className="page-actions">
          <Link
            className="button"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={17} />
            Ver página
          </Link>
          <Link className="button button-primary" href="/admin/banners/novo">
            <Plus size={18} />
            Novo banner
          </Link>
        </div>
      </div>
      {banners.length ? (
        <BannerList
          key={banners
            .map((banner) => `${banner.id}:${banner.updated_at}`)
            .join("|")}
          initial={banners}
          mockMode={mockMode}
        />
      ) : (
        <div className="empty card">
          <h2>Ainda não existem banners.</h2>
          <p>Crie seu primeiro banner para começar a montar sua Link Bio.</p>
          <Link className="button button-primary" href="/admin/banners/novo">
            <Plus size={18} />
            Criar banner
          </Link>
        </div>
      )}
    </>
  );
}
