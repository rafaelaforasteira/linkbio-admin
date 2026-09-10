import { ChevronDown, Gem } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getPublicBanners } from "@/lib/banner-queries";
import "./public.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const banners = await getPublicBanners();
  return (
    <main className="public-page">
      <div className="ticker" aria-label="Diferenciais Xingyu"><div>ESPECIALISTA EM SEMIJOIAS <Gem/> JOIAS DE FÁBRICA <Gem/> QUALIDADE PREMIUM <Gem/> ACABAMENTO IMPECÁVEL <Gem/> ESPECIALISTA EM SEMIJOIAS</div></div>
      <header className="public-hero">
        <BrandMark />
        <h1 className="serif">Referência em<br/>Semijoias</h1>
        <p>Semijoias premium há mais de 20 anos, com acabamento impecável e preços até 5x menores direto da fábrica.</p>
        <a className="scroll-cue" href="#banners" aria-label="Ver banners"><ChevronDown size={18}/></a>
      </header>
      <section id="banners" className="banner-column" aria-label="Destaques Xingyu">
        {banners.map((banner) => {
          const image = <img src={banner.image_url} alt={banner.alt_text || banner.internal_name} width="900" height="360" loading="lazy"/>;
          return banner.destination_url ? <a key={banner.id} className="public-banner" href={banner.destination_url} target={banner.open_new_tab?"_blank":undefined} rel={banner.open_new_tab?"noopener noreferrer":undefined} aria-label={banner.alt_text||banner.internal_name}>{image}</a> : <div key={banner.id} className="public-banner">{image}</div>;
        })}
        {!banners.length && <div className="public-empty">Nenhum destaque publicado no momento.</div>}
      </section>
      <footer><a href="https://www.xingyu.com.br">www.xingyu.com.br</a><span>© 2026 Xingyu — Todos os direitos reservados</span></footer>
    </main>
  );
}
