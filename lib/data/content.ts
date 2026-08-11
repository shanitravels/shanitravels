import { connectDB } from "@/lib/db";
import { OfficeModel, ClientModel, TestimonialModel, ServiceModel } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { TAGS } from "@/lib/tags";
import { cachedRead } from "@/lib/data/cache";
import type { Client, Office, Service, Testimonial } from "@/lib/types";

/**
 * Cached public reads for offices, clients, testimonials and services.
 * Reads throw on failure by design — `cachedRead` keeps failures out of the
 * cache so an outage never persists as empty content.
 */

export const getActiveOffices = cachedRead({
  label: "content/getActiveOffices",
  keys: ["active-offices"],
  tags: [TAGS.offices],
  fallback: [] as Office[],
  read: async (): Promise<Office[]> => {
    await connectDB();
    const docs = await OfficeModel.find({ active: true })
      .sort({ isHeadOffice: -1, order: 1, city: 1 })
      .lean();
    return serialize<Office[]>(docs);
  },
});

export const getActiveClients = cachedRead({
  label: "content/getActiveClients",
  keys: ["active-clients"],
  tags: [TAGS.clients],
  fallback: [] as Client[],
  read: async (): Promise<Client[]> => {
    await connectDB();
    const docs = await ClientModel.find({ active: true }).sort({ order: 1, name: 1 }).lean();
    return serialize<Client[]>(docs);
  },
});

export async function getFeaturedClients(): Promise<Client[]> {
  const clients = await getActiveClients();
  return clients.filter((c) => c.featured);
}

export const getActiveTestimonials = cachedRead({
  label: "content/getActiveTestimonials",
  keys: ["active-testimonials"],
  tags: [TAGS.testimonials],
  fallback: [] as Testimonial[],
  read: async (): Promise<Testimonial[]> => {
    await connectDB();
    const docs = await TestimonialModel.find({ active: true }).sort({ order: 1 }).lean();
    return serialize<Testimonial[]>(docs);
  },
});

export const getActiveServices = cachedRead({
  label: "content/getActiveServices",
  keys: ["active-services"],
  tags: [TAGS.services],
  fallback: [] as Service[],
  read: async (): Promise<Service[]> => {
    await connectDB();
    const docs = await ServiceModel.find({ active: true }).sort({ order: 1, title: 1 }).lean();
    return serialize<Service[]>(docs);
  },
});

export const getServiceBySlug = cachedRead({
  label: "content/getServiceBySlug",
  keys: ["service-by-slug"],
  tags: [TAGS.services],
  fallback: null as Service | null,
  read: async (slug: string): Promise<Service | null> => {
    await connectDB();
    const doc = await ServiceModel.findOne({ slug, active: true }).lean();
    return doc ? serialize<Service>(doc) : null;
  },
});
