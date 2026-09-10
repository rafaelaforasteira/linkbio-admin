import { Clock3, ImageIcon, Megaphone, PanelTop } from "lucide-react";
import "../dashboard.css";
export default function SettingsPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <h1 className="serif">Configurações da página</h1>
          <p>Identidade e conteúdo institucional da Link Bio.</p>
        </div>
      </div>
      <div className="card coming-soon">
        <Clock3 />
        <div>
          <strong>Configuração institucional em breve</strong>
          <p>
            Logo, título, descrição, ticker e rodapé continuam preservados no
            código nesta V1. Esta tela não simula controles que ainda não
            existem.
          </p>
        </div>
      </div>
      <div
        className="settings-preview-grid"
        aria-label="Configurações previstas"
      >
        <div className="card setting-preview">
          <ImageIcon />
          <div>
            <strong>Identidade</strong>
            <span>Logo e elementos visuais da marca</span>
          </div>
          <small>Em breve</small>
        </div>
        <div className="card setting-preview">
          <PanelTop />
          <div>
            <strong>Conteúdo institucional</strong>
            <span>Título, descrição e rodapé</span>
          </div>
          <small>Em breve</small>
        </div>
        <div className="card setting-preview">
          <Megaphone />
          <div>
            <strong>Faixa superior</strong>
            <span>Mensagens exibidas no ticker</span>
          </div>
          <small>Em breve</small>
        </div>
      </div>
    </>
  );
}
