import type { SiteSettings, Office, Vehicle } from "@/lib/types";

export const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/** Render a JSON-LD <script> block. Safe: data is JSON, not user markup. */
export function jsonLdScript(data: object) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** TravelAgency / LocalBusiness schema for the homepage, including offices. */
export function localBusinessJsonLd(settings: SiteSettings, offices: Office[]) {
  const head = offices.find((o) => o.isHeadOffice) ?? offices[0];
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Shani Travels",
    description: settings.seoDefaults.description,
    url: SITE_URL,
    telephone: settings.helplineNumbers[0],
    email: settings.emails[0],
    foundingDate: "1997",
    priceRange: "$$",
    areaServed: "PK",
    address: head
      ? {
          "@type": "PostalAddress",
          streetAddress: head.address,
          addressLocality: head.city,
          addressCountry: "PK",
        }
      : undefined,
    location: offices.map((o) => ({
      "@type": "Place",
      name: `Shani Travels — ${o.city}`,
      address: { "@type": "PostalAddress", streetAddress: o.address, addressLocality: o.city, addressCountry: "PK" },
    })),
    // `sameAs` is how a search engine ties these profiles to the business, so a
    // newly added network belongs here as well as in the footer.
    sameAs: [
      settings.socials.facebook,
      settings.socials.instagram,
      settings.socials.pinterest,
      settings.socials.linkedin,
    ].filter(Boolean),
  };
}

/** Product/Offer schema for a vehicle detail page (offer omitted when unpriced). */
export function vehicleJsonLd(vehicle: Vehicle) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vehicle.name,
    image: vehicle.images.map((i) => i.url),
    description: `${vehicle.name} — chauffeur-driven ${vehicle.seats}-seat ${vehicle.class} for hire from Shani Travels.`,
    brand: { "@type": "Brand", name: "Shani Travels" },
    category: vehicle.class,
    ...(vehicle.rates.perDay != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: vehicle.currency || "PKR",
            price: vehicle.rates.perDay,
            availability: vehicle.active
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/fleet/${vehicle.slug}`),
          },
        }
      : {}),
  };
}
