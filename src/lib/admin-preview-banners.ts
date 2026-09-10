import type { Banner } from "@/types/banner";

const hour = 60 * 60 * 1000;

export function getAdminPreviewBanners(now = new Date()): Banner[] {
  const iso = (offset: number) =>
    new Date(now.getTime() + offset).toISOString();
  const base = (id: string, name: string, order: number): Banner => ({
    id,
    internal_name: name,
    image_url: "/admin/banner-placeholder.svg",
    image_path: null,
    destination_url: `https://www.xingyu.com.br/${id.replace("mock-", "")}`,
    alt_text: `Banner de demonstração: ${name}`,
    sort_order: order,
    enabled: true,
    publish_at: null,
    unpublish_at: null,
    open_new_tab: false,
    created_at: iso(-30 * 24 * hour),
    updated_at: iso(-order * 6 * hour),
    deleted_at: null,
  });

  return [
    base("mock-live", "Live das Semijoias", 0),
    base("mock-estoque", "Estoque sem Crise", 1),
    base("mock-catalogo", "Catálogo", 2),
    { ...base("mock-vip", "Grupo VIP", 3), enabled: false },
    {
      ...base("mock-golden", "Golden Season", 4),
      publish_at: iso(48 * hour),
      unpublish_at: iso(120 * hour),
    },
    {
      ...base("mock-antiga", "Campanha antiga", 5),
      publish_at: iso(-240 * hour),
      unpublish_at: iso(-48 * hour),
    },
  ];
}
