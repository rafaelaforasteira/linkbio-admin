import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { getAllBanners } from "@/lib/banner-queries";
import { bannerStatus, formatDate } from "@/lib/banners";
import "../banners/banners.css";

export default async function SchedulesPage() {
  const items = (await getAllBanners())
    .filter((banner) => bannerStatus(banner) === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.publish_at!).getTime() - new Date(b.publish_at!).getTime(),
    );
  return (
    <>
      <div className="page-title">
        <div>
          <h1 className="serif">Programações</h1>
          <p>Veja as próximas campanhas em ordem de entrada.</p>
        </div>
        <Link className="button button-primary" href="/admin/banners/novo">
          <Plus size={18} />
          Novo banner
        </Link>
      </div>
      {items.length ? (
        <div className="schedule-list">
          {items.map((banner) => (
            <article className="card schedule" key={banner.id}>
              <img src={banner.image_url} alt="" />
              <div className="schedule-name">
                <strong>{banner.internal_name}</strong>
                <span className="status scheduled">Programado</span>
              </div>
              <span>
                Entrada
                <br />
                <b>{formatDate(banner.publish_at)}</b>
              </span>
              <span>
                Saída
                <br />
                <b>{formatDate(banner.unpublish_at) || "Sem encerramento"}</b>
              </span>
              <Link className="button" href={`/admin/banners/${banner.id}`}>
                <Pencil size={15} />
                Editar
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty card">
          <h2>Nenhum banner programado.</h2>
          <p>Crie um banner e defina uma data futura para a entrada.</p>
          <Link className="button button-primary" href="/admin/banners/novo">
            <Plus size={18} />
            Programar banner
          </Link>
        </div>
      )}
    </>
  );
}
