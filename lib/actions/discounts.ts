"use server";

import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { DiscountModel } from "@/lib/models";
import { discountSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth/session";
import { toActionError } from "@/lib/actions/helpers";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import type { ActionResult, DiscountDoc } from "@/lib/types";

/**
 * Discounts change published prices, so every mutation busts BOTH the discount
 * tag and the vehicle tag — the fleet pages render rates and would otherwise
 * keep serving the undiscounted figures from cache.
 */
function bust(): void {
  revalidateTag(TAGS.discounts, "max");
  revalidateTag(TAGS.vehicles, "max");
}

function toDoc(data: ReturnType<typeof discountSchema.parse>) {
  return {
    name: data.name,
    label: data.label,
    type: data.type,
    value: data.value,
    scope: data.scope,
    // Clear the irrelevant selector so a scope change cannot leave stale targets
    // behind that would silently widen the discount if the scope flips back.
    vehicleClasses: data.scope === "class" ? data.vehicleClasses : [],
    vehicles: data.scope === "vehicle" ? data.vehicles : [],
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    active: data.active,
  };
}

export async function createDiscount(input: unknown): Promise<ActionResult<DiscountDoc>> {
  try {
    await requireAdmin();
    const data = discountSchema.parse(input);
    await connectDB();
    const doc = await DiscountModel.create(toDoc(data));
    bust();
    return { ok: true, data: serialize<DiscountDoc>(doc.toObject()), message: "Discount created" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateDiscount(id: string, input: unknown): Promise<ActionResult<DiscountDoc>> {
  try {
    await requireAdmin();
    const data = discountSchema.parse(input);
    await connectDB();
    const doc = await DiscountModel.findByIdAndUpdate(id, { $set: toDoc(data) }, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!doc) return { ok: false, error: "That discount no longer exists." };
    bust();
    return { ok: true, data: serialize<DiscountDoc>(doc), message: "Discount saved" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function setDiscountActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await DiscountModel.updateOne({ _id: id }, { $set: { active } });
    bust();
    return { ok: true, message: active ? "Discount is live" : "Discount paused" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await DiscountModel.deleteOne({ _id: id });
    bust();
    return { ok: true, message: "Discount deleted" };
  } catch (err) {
    return toActionError(err);
  }
}
