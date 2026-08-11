"use server";

import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { AdminUserModel } from "@/lib/models";
import { adminUserSchema } from "@/lib/validation";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/** Admin-role-only user management. Guards against locking yourself out. */

export async function createAdminUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const data = adminUserSchema.parse(input);
    if (!data.password) {
      return { ok: false, error: "A password is required for new users.", fieldErrors: { password: ["Required"] } };
    }
    await connectDB();
    const doc = await AdminUserModel.create({
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      active: data.active,
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    return { ok: true, data: { id: String(doc._id) }, message: `${data.name} can now sign in.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateAdminUser(id: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const data = adminUserSchema.parse(input);
    await connectDB();

    if (session.userId === id && (data.role !== "admin" || !data.active)) {
      return { ok: false, error: "You can't demote or deactivate your own account." };
    }

    const update: Record<string, unknown> = {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      active: data.active,
    };
    if (data.password) {
      update.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const doc = await AdminUserModel.findByIdAndUpdate(id, update, { runValidators: true });
    if (!doc) return { ok: false, error: "User not found." };
    return { ok: true, message: "User saved." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteAdminUser(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (session.userId === id) {
      return { ok: false, error: "You can't delete your own account." };
    }
    await connectDB();
    const doc = await AdminUserModel.findByIdAndDelete(id);
    if (!doc) return { ok: false, error: "User not found." };
    return { ok: true, message: "User removed." };
  } catch (err) {
    return toActionError(err);
  }
}
