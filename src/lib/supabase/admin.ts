import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getAdminSupabaseEnv } from "@/lib/env";

export function createAdminClient() {
  const { url, key } = getAdminSupabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
