"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUserModel } from "@/lib/models";
import { createSession, destroySession, ADMIN_HOME } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export interface LoginState {
  error: string | null;
}

/** Credentials sign-in for the admin panel. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  if (!(await checkRateLimit("login", 10))) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  let user;
  try {
    await connectDB();
    user = await AdminUserModel.findOne({ email: parsed.data.email.toLowerCase() }).lean();
  } catch (err) {
    console.error("[auth] login lookup failed:", err);
    return { error: "Could not reach the database. Please try again." };
  }

  // Constant-shape comparison even when the user doesn't exist.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valid = await bcrypt.compare(parsed.data.password, hash);

  if (!user || !valid || !user.active) {
    return { error: "Incorrect email or password." };
  }

  await createSession({
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const from = formData.get("from");
  const fromValid =
    typeof from === "string" &&
    (from.startsWith("/admin") || from.startsWith("/ops")) &&
    !from.includes("//");
  // proxy.ts re-routes if `from` isn't allowed for this role.
  redirect(fromValid ? (from as string) : ADMIN_HOME);
}

/** Form-action signature (returns void); `redirect` throws control-flow. */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
