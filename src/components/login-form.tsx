"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { safeAdminPath } from "@/lib/banners";

export function LoginForm({ configured }: { configured: boolean }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const { error: authError } = await createClient().auth.signInWithPassword(
        {
          email: String(data.get("email")),
          password: String(data.get("password")),
        },
      );
      if (authError) {
        setError("E-mail ou senha incorretos.");
        return;
      }
      router.replace(safeAdminPath(params.get("next")));
      router.refresh();
    } catch {
      setError(
        "Não foi possível entrar. Verifique a configuração e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <div className="secure-label">
        <LockKeyhole size={14} /> Área interna protegida
      </div>
      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          className="field"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!configured || loading}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <div className="password-wrap">
          <input
            className="field"
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={!configured || loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShow(!show)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={!configured || loading}
      >
        {loading ? (
          <>
            <LoaderCircle className="animate-spin" size={18} />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
