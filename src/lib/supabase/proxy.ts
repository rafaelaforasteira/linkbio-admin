import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseEnv,
  hasSupabaseEnv,
  isAdminPreviewMode,
} from "@/lib/env";

function loginRedirect(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";
  target.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(target);
}

export async function updateSession(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  if (isAdmin && isAdminPreviewMode()) return NextResponse.next();

  if (!hasSupabaseEnv())
    return isAdmin ? loginRedirect(request) : NextResponse.next();

  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (isAdmin && !data?.claims) return loginRedirect(request);
  if (request.nextUrl.pathname === "/login" && data?.claims) {
    const target = request.nextUrl.clone();
    target.pathname = "/admin";
    target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}
