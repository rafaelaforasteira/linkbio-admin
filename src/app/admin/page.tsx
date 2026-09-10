import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getAllBanners } from "@/lib/banner-queries";
import { getAdminPreviewBanners } from "@/lib/admin-preview-banners";
import { hasAdminSupabaseEnv, isAdminPreviewMode } from "@/lib/env";
import { bannerStatus, formatDate } from "@/lib/banners";
import "./dashboard.css";

const statusLabels = {
  published: "Publicado",
  scheduled: "Programado",
  hidden: "Oculto",
  ended: "Encerrado",
};

export default async function Dashboard() {
  const mockMode = isAdminPreviewMode() && !hasAdminSupabaseEnv();
  const banners = mockMode ? getAdminPreviewBanners() : await getAllBanners();
  const count = (status: ReturnType<typeof bannerStatus>) =>
    banners.filter((banner) => bannerStatus(banner) === status).length;
  return (
    <>
      <div className="page-title">
        <div>
          <h1 className="serif">Visão geral</h1>
          <p>Acompanhe e gerencie o conteúdo da sua Link Bio.</p>
        </div>
        <Link className="button button-primary" href="/admin/banners/novo">
          <Plus size={18} />
          Novo banner
        </Link>
      </div>
      <section className="stats">
        <div className="card stat published-stat">
          <span>Publicados</span>
          <strong>{count("published")}</strong>
        </div>
        <div className="card stat scheduled-stat">
          <span>Programados</span>
          <strong>{count("scheduled")}</strong>
        </div>
        <div className="card stat hidden-stat">
          <span>Ocultos</span>
          <strong>{count("hidden")}</strong>
        </div>
        <div className="card stat ended-stat">
          <span>Encerrados</span>
          <strong>{count("ended")}</strong>
        </div>
      </section>
      <div className="section-head">
        <h2>Conteúdo recente</h2>
        <Link href="/admin/banners">
          Ver todos <ArrowRight size={15} />
        </Link>
      </div>
      {banners.length ? (
        <div className="recent-list card">
          {banners.slice(0, 4).map((banner) => (
            <Link key={banner.id} href={`/admin/banners/${banner.id}`}>
              <img src={banner.image_url} alt="" />
              <span>
                <strong>{banner.internal_name}</strong>
                <small>{formatDate(banner.updated_at)}</small>
              </span>
              <span className={`status ${bannerStatus(banner)}`}>
                {statusLabels[bannerStatus(banner)]}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card config-note">
          Ainda não existem banners. Crie o primeiro para começar a montar sua
          Link Bio.
        </div>
      )}
    </>
  );
}
