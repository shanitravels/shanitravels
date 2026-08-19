"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { VehicleModel, BookingModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { normalizeVehicleRates } from "@/lib/pricing";
import { TAGS } from "@/lib/tags";
import { vehicleSchema, ratesBulkSchema } from "@/lib/validation";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult, Vehicle } from "@/lib/types";

/** Admin CRUD for the vehicle catalog. Every mutation revalidates TAGS.vehicles. */

export async function createVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const data = vehicleSchema.parse(input);
    await connectDB();
    const doc = await VehicleModel.create(data);
    updateTag(TAGS.vehicles);
    return { ok: true, data: { id: String(doc._id) }, message: `${data.name} created.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateVehicle(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = vehicleSchema.parse(input);
    await connectDB();
    // No preserveUrdu here: VehicleForm renders an Urdu input beside every
    // English one and submits both sides, so it is authoritative — including
    // when a translation is deliberately cleared. This mirrors BILINGUAL_EDITORS
    // in lib/actions/content.ts; vehicles simply have their own action file.
    const doc = await VehicleModel.findByIdAndUpdate(id, data, {
      runValidators: true,
    });
    if (!doc) return { ok: false, error: "Vehicle not found." };
    updateTag(TAGS.vehicles);
    return { ok: true, message: `${data.name} saved.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleVehicleFlag(
  id: string,
  flag: "active" | "featured",
  value: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const doc = await VehicleModel.findByIdAndUpdate(id, { [flag]: value });
    if (!doc) return { ok: false, error: "Vehicle not found." };
    updateTag(TAGS.vehicles);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

/** Persist a manual sort order within a class (drag-to-reorder). */
export async function reorderVehicles(orders: { id: string; order: number }[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await VehicleModel.bulkWrite(
      orders.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { order } },
      }))
    );
    updateTag(TAGS.vehicles);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Hard delete — deliberately guarded. Blocked when bookings reference the
 * vehicle (deactivate instead); the UI additionally requires typed confirmation.
 */
export async function deleteVehicle(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const bookingCount = await BookingModel.countDocuments({ vehicle: id });
    if (bookingCount > 0) {
      return {
        ok: false,
        error: `This vehicle is referenced by ${bookingCount} booking(s). Deactivate it instead of deleting.`,
      };
    }
    const doc = await VehicleModel.findByIdAndDelete(id);
    if (!doc) return { ok: false, error: "Vehicle not found." };
    updateTag(TAGS.vehicles);
    return { ok: true, message: `${doc.name} permanently deleted.` };
  } catch (err) {
    return toActionError(err);
  }
}

/** Bulk rate save from the Rates grid — the yearly rate-card workflow. */
export async function saveRatesBulk(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const rows = ratesBulkSchema.parse(input);
    await connectDB();
    await VehicleModel.bulkWrite(
      rows.map(({ id, rates }) => ({
        updateOne: { filter: { _id: id }, update: { rates } },
      }))
    );
    updateTag(TAGS.vehicles);
    return { ok: true, message: `Rates saved for ${rows.length} vehicle(s).` };
  } catch (err) {
    return toActionError(err);
  }
}

/** Admin-side list (includes inactive). Uncached — the CMS always reads fresh. */
export async function listVehiclesAdmin(): Promise<ActionResult<Vehicle[]>> {
  try {
    await requireAdmin();
    await connectDB();
    const docs = await VehicleModel.find().sort({ class: 1, order: 1, name: 1 }).lean();
    return { ok: true, data: serialize<Vehicle[]>(docs).map(normalizeVehicleRates) };
  } catch (err) {
    return toActionError(err);
  }
}
