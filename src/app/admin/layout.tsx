import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { isAdminPreviewMode } from "@/lib/env";
import "./admin.css";

export const metadata: Metadata = {
  title: "Painel | Xingyu",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const previewMode = isAdminPreviewMode();
  const email = previewMode
    ? "Preview local"
    : (await (await createClient()).auth.getUser()).data.user?.email ||
      "Conta autenticada";

  return (
    <AdminShell email={email} previewMode={previewMode}>
      {children}
    </AdminShell>
  );
}
