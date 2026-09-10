import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { isAdminPreviewMode } from "@/lib/env";

function loginRedirect(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/login";
  target.search = "";
  target.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(target);
}

export async function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  if (isAdminPreviewMode()) {
    return request.nextUrl.pathname === "/login"
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  const valid = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET,
  );
  if (isAdmin && !valid) return loginRedirect(request);
  if (request.nextUrl.pathname === "/login" && valid)
    return NextResponse.redirect(new URL("/admin", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/login"] };
