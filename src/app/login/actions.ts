"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setAdminSession } from "@/lib/admin-auth";
import { safeAdminPath } from "@/lib/banners";
import { hasAdminAuthEnv } from "@/lib/env";

type LoginState = { error: string };
type Attempt = { count: number; resetAt: number };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, Attempt>();

async function clientAddress() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string, now: number) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

function registerFailure(key: string, now: number) {
  const current = attempts.get(key);
  attempts.set(key, {
    count: (current?.count ?? 0) + 1,
    resetAt:
      current?.resetAt && current.resetAt > now
        ? current.resetAt
        : now + WINDOW_MS,
  });
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const ip = await clientAddress();
  const now = Date.now();
  if (isRateLimited(ip, now))
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hasAdminAuthEnv() || !hash) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? "Configure ADMIN_PASSWORD_HASH e ADMIN_SESSION_SECRET."
          : "Não foi possível entrar. Tente novamente mais tarde.",
    };
  }

  const password = String(formData.get("password") || "");
  if (!password || !(await compare(password, hash))) {
    registerFailure(ip, now);
    return { error: "Senha incorreta." };
  }

  attempts.delete(ip);
  await setAdminSession();
  redirect(safeAdminPath(String(formData.get("next") || "")));
}
