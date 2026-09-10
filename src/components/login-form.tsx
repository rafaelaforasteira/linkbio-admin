"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/login/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [show, setShow] = useState(false);
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState(login, { error: "" });

  return (
    <form className="login-form" action={formAction}>
      <input type="hidden" name="next" value={params.get("next") || "/admin"} />
      <div className="secure-label">
        <LockKeyhole size={14} /> Área interna protegida
      </div>
      <div>
        <label className="label" htmlFor="password">
          Senha administrativa
        </label>
        <div className="password-wrap">
          <input
            className="field"
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={!configured || pending}
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
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={!configured || pending}
      >
        {pending ? (
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
