export function hasPublicSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasAdminSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasAdminAuthEnv() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(
    process.env.ADMIN_PASSWORD_HASH && secret && secret.length >= 32,
  );
}

export function isAdminPreviewMode() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_PREVIEW_MODE === "true"
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return { url, key };
}

export function getAdminSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrativo não configurado.");
  return { url, key };
}
