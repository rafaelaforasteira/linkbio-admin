import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseEnv } from "@/lib/env";
import { Suspense } from "react";
import "./login.css";
import "./security.css";

export const metadata: Metadata = {
  title: "Acesse o painel | Xingyu",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-ticker">
        ESPECIALISTA EM SEMIJOIAS · JOIAS DE FÁBRICA · QUALIDADE PREMIUM
      </div>
      <section className="login-card">
        <BrandMark />
        <h1 className="serif">Acesse o painel</h1>
        <p>Gerencie sua Link Bio Xingyu.</p>
        {!hasSupabaseEnv() && (
          <div className="setup-note">
            Configure as variáveis do Supabase para habilitar o acesso.
          </div>
        )}
        <Suspense fallback={<div className="helper">Carregando acesso...</div>}>
          <LoginForm configured={hasSupabaseEnv()} />
        </Suspense>
        <small>© Xingyu</small>
      </section>
    </main>
  );
}
