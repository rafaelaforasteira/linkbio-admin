"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  ExternalLink,
  ImageIcon,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { logout } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Visão geral", icon: BarChart3 },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/programacoes", label: "Programações", icon: CalendarClock },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminShell({
  children,
  email,
  previewMode,
}: {
  children: React.ReactNode;
  email: string;
  previewMode: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="admin-shell">
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={open ? "is-open" : ""}>
        <div className="sidebar-brand">
          <div className="brand-stack">
            <BrandMark compact />
            <span>Central de campanhas</span>
          </div>
          <button
            className="close-menu"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Administração">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={active(href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="user-role">Administrador</span>
          <small>{email}</small>
          {!previewMode && (
            <form action={logout}>
              <button>
                <LogOut />
                Sair
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="admin-body">
        <header>
          <div className="header-title">
            <button
              className="open-menu"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu />
            </button>
            <span>Painel administrativo</span>
            <strong>Link Bio</strong>
          </div>
          <div className="header-actions">
            {previewMode && (
              <span className="preview-mode-badge">
                Modo de visualização — alterações não são persistidas
              </span>
            )}
            <Link
              className="button"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver página
              <ExternalLink size={16} />
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
