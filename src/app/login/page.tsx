import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { hasAdminAuthEnv } from "@/lib/env";
import "./login.css";
import "./security.css";

export const metadata: Metadata = {
  title: "Acesse o painel | Xingyu",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await hasValidAdminSession()) redirect("/admin");
  const configured = hasAdminAuthEnv();
  return (
    <main className="login-page">
      <div className="login-ticker">
        ESPECIALISTA EM SEMIJOIAS · JOIAS DE FÁBRICA · QUALIDADE PREMIUM
      </div>
      <section className="login-card">
        <BrandMark />
        <h1 className="serif">Acesse o painel</h1>
        <p>Gerencie sua Link Bio Xingyu.</p>
        {!configured && process.env.NODE_ENV === "development" && (
          <div className="setup-note">
            Configure ADMIN_PASSWORD_HASH e ADMIN_SESSION_SECRET para habilitar
            o acesso.
          </div>
        )}
        <Suspense fallback={<div className="helper">Carregando acesso...</div>}>
          <LoginForm configured={configured} />
        </Suspense>
        <small>© Xingyu</small>
      </section>
    </main>
  );
}
