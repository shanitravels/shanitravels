import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import type { AdminRole } from "@/lib/types";

/**
 * Stateless admin sessions, following the Next.js 16 authentication guide:
 * a jose-signed JWT in an httpOnly cookie. `proxy.ts` does the optimistic
 * check; real authorization happens here (`requireAdmin`) inside every
 * server action and in the admin layout.
 */

export const SESSION_COOKIE = "st_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: number;
  [key: string]: unknown;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set (see .env.example).");
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(getSecretKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encryptSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Read + verify the session cookie. Deduplicated per request via React cache. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
});

/**
 * Authorization gates used inside every server action and layout.
 * Throws when unauthenticated or when the session role isn't in the allowed set.
 *
 * There is exactly one role now — "admin", full access. The signature still
 * takes a role list so the call sites read explicitly and so re-introducing a
 * tier later is a types-only change.
 */
export async function requireRole(...roles: AdminRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

/**
 * Kept as the panel-wide gate so every page/action has one obvious entry point.
 * The old "editor" vs "admin" distinction collapsed with the role tiers.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  return requireRole("admin");
}

/** Where a signed-in user lands. One role, one destination. */
export const ADMIN_HOME = "/admin";
