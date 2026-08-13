"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import {
  OfficeModel,
  ClientModel,
  TestimonialModel,
  ServiceModel,
  IndustryModel,
  SafetySectionModel,
} from "@/lib/models";
import { TAGS, type CacheTag } from "@/lib/tags";
import {
  officeSchema,
  clientSchema,
  testimonialSchema,
  serviceSchema,
  industrySchema,
  safetySectionSchema,
} from "@/lib/validation";
import { toActionError, preserveUrdu } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";
import type { Model } from "mongoose";

/**
 * Admin CRUD for the content collections. All share the same shape:
 * create / update / toggle active|featured / reorder / delete, each
 * revalidating its cache tag.
 */

type Collection = "office" | "client" | "testimonial" | "service" | "industry" | "safety";

const registry: Record<
  Collection,
  { model: Model<never>; schema: { parse: (v: unknown) => unknown }; tag: CacheTag; label: string }
> = {
  office: { model: OfficeModel as Model<never>, schema: officeSchema, tag: TAGS.offices, label: "Office" },
  client: { model: ClientModel as Model<never>, schema: clientSchema, tag: TAGS.clients, label: "Client" },
  testimonial: {
    model: TestimonialModel as Model<never>,
    schema: testimonialSchema,
    tag: TAGS.testimonials,
    label: "Testimonial",
  },
  service: { model: ServiceModel as Model<never>, schema: serviceSchema, tag: TAGS.services, label: "Service" },
  industry: { model: IndustryModel as Model<never>, schema: industrySchema, tag: TAGS.industries, label: "Industry" },
  safety: {
    model: SafetySectionModel as Model<never>,
    schema: safetySectionSchema,
    tag: TAGS.safety,
    label: "Safety section",
  },
};

/**
 * Collections whose admin form renders an Urdu input beside every English one
 * (via `LocalizedField`), and therefore submits both sides itself.
 *
 * Add a collection here in the same commit that gives its manager Urdu inputs —
 * the two must move together. Listing one whose form is still English-only
 * would let an English edit blank the translation; omitting one that has Urdu
 * inputs would make clearing a translation impossible.
 */
const BILINGUAL_EDITORS = new Set<Collection>(["service", "testimonial", "office", "industry", "safety"]);

export async function createContent(
  collection: Collection,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const { model, schema, tag, label } = registry[collection];
    const data = schema.parse(input);
    await connectDB();

    // Only one head office at a time.
    if (collection === "office" && (data as { isHeadOffice?: boolean }).isHeadOffice) {
      await OfficeModel.updateMany({}, { isHeadOffice: false });
    }

    const doc = await (model as Model<Record<string, unknown>>).create(data as Record<string, unknown>);
    updateTag(tag);
    return { ok: true, data: { id: String(doc._id) }, message: `${label} created.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateContent(
  collection: Collection,
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { model, schema, tag, label } = registry[collection];
    const data = schema.parse(input);
    await connectDB();

    if (collection === "office" && (data as { isHeadOffice?: boolean }).isHeadOffice) {
      await OfficeModel.updateMany({ _id: { $ne: id } }, { isHeadOffice: false });
    }

    // A form with Urdu inputs posts both sides and is authoritative for both —
    // including a deliberately cleared translation. Everywhere else the form
    // posts English only, so the stored Urdu has to be merged back in or an
    // English typo fix would wipe it.
    let merged = data as Record<string, unknown>;
    if (!BILINGUAL_EDITORS.has(collection)) {
      const current = await (model as Model<Record<string, unknown>>).findById(id).lean();
      merged = preserveUrdu(merged, current);
    }

    const doc = await (model as Model<Record<string, unknown>>).findByIdAndUpdate(
      id,
      merged,
      { runValidators: true }
    );
    if (!doc) return { ok: false, error: `${label} not found.` };
    updateTag(tag);
    return { ok: true, message: `${label} saved.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleContentFlag(
  collection: Collection,
  id: string,
  flag: "active" | "featured",
  value: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { model, tag, label } = registry[collection];
    await connectDB();
    const doc = await (model as Model<Record<string, unknown>>).findByIdAndUpdate(id, {
      [flag]: value,
    });
    if (!doc) return { ok: false, error: `${label} not found.` };
    updateTag(tag);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reorderContent(
  collection: Collection,
  orders: { id: string; order: number }[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { model, tag } = registry[collection];
    await connectDB();
    await (model as Model<Record<string, unknown>>).bulkWrite(
      orders.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { order } },
      }))
    );
    updateTag(tag);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteContent(collection: Collection, id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { model, tag, label } = registry[collection];
    await connectDB();
    const doc = await (model as Model<Record<string, unknown>>).findByIdAndDelete(id);
    if (!doc) return { ok: false, error: `${label} not found.` };
    updateTag(tag);
    return { ok: true, message: `${label} deleted.` };
  } catch (err) {
    return toActionError(err);
  }
}
