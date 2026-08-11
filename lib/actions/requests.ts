"use server";

import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { BookingModel, EnquiryModel } from "@/lib/models";
import {
  bookingStatusSchema,
  enquiryStatusSchema,
  verificationFlagSchema,
} from "@/lib/validation";
import { toActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

/** Admin workflow actions for bookings and corporate enquiries. */

export async function setBookingStatus(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { id, status } = bookingStatusSchema.parse(input);
    await connectDB();
    const doc = await BookingModel.findByIdAndUpdate(id, { status });
    if (!doc) return { ok: false, error: "Booking not found." };
    return { ok: true, message: `Booking ${doc.reference} → ${status}.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function saveBookingNotes(id: string, notes: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const doc = await BookingModel.findByIdAndUpdate(id, { adminNotes: notes.slice(0, 3000) });
    if (!doc) return { ok: false, error: "Booking not found." };
    return { ok: true, message: "Notes saved." };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Tick/untick a self-drive verification flag (CNIC, licence, agreement,
 * declaration), stamping who and when.
 */
export async function setVerificationFlag(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { bookingId, flag, done } = verificationFlagSchema.parse(input);
    await connectDB();
    const booking = await BookingModel.findById(bookingId);
    if (!booking) return { ok: false, error: "Booking not found." };
    if (booking.serviceMode !== "self-drive") {
      return { ok: false, error: "Verification applies to self-drive bookings only." };
    }
    const value = done
      ? { done: true, by: session.name, at: new Date() }
      : { done: false, by: null, at: null };
    await BookingModel.findByIdAndUpdate(bookingId, {
      $set: { [`verification.${flag}`]: value },
    });
    return { ok: true, message: done ? "Verified." : "Verification cleared." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function setEnquiryStatus(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { id, status } = enquiryStatusSchema.parse(input);
    await connectDB();
    const doc = await EnquiryModel.findByIdAndUpdate(id, { status });
    if (!doc) return { ok: false, error: "Enquiry not found." };
    return { ok: true, message: `Enquiry ${doc.reference} → ${status}.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function saveEnquiryNotes(id: string, notes: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const doc = await EnquiryModel.findByIdAndUpdate(id, { adminNotes: notes.slice(0, 3000) });
    if (!doc) return { ok: false, error: "Enquiry not found." };
    return { ok: true, message: "Notes saved." };
  } catch (err) {
    return toActionError(err);
  }
}
