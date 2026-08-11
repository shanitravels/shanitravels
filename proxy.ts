import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Optimistic guard for the admin panel (Next.js 16 "proxy" — the renamed
 * middleware convention). Verifies the session cookie's signature and expiry;
 * real authorization is re-checked server-side in requireAdmin() inside every
 * action and layout, so this is a redirect convenience, not the security
 * boundary.
 *
 * There is a single role, so this no longer maps routes to roles — a valid
 * session may reach anything under /admin.
 */

const SESSION_COOKIE = "st_session";

async function hasSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = await hasSession(req);
  const isLoginPage = pathname === "/admin/login";

  if (!signedIn) {
    if (isLoginPage) return NextResponse.next();
    const loginUrl = new URL("/admin/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
