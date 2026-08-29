import type { Metadata } from "next";
import { FiCamera } from "react-icons/fi";
import { getActiveGalleryImages } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.photoGallery.metaTitle,
    description: t.photoGallery.metaDescription,
    alternates: { canonical: "/gallery" },
  };
}

export default async function GalleryPage() {
  const { t } = await getI18n();
  const images = await getActiveGalleryImages();

  return (
    <>
      {/* Hero — its own band rather than the shared PageIntro, because the
          two-tone title and the camera motif are specific to this page. */}
      <section className="relative overflow-hidden bg-navy-deep">
        {/* Decoration only: hidden from assistive tech, and clipped by the
            section so it can never widen the page on a phone. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <FiCamera className="absolute -right-6 top-4 h-48 w-48 text-white/[0.04] sm:right-24 sm:h-56 sm:w-56" />
          <svg
            className="absolute right-16 top-24 hidden h-24 w-72 text-white/15 lg:block"
            viewBox="0 0 300 100"
            fill="none"
          >
            <path
              d="M2 82C60 82 92 12 168 12c46 0 74 22 92 40"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute right-10 top-14 hidden h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg lg:flex">
            <FiCamera className="h-6 w-6" />
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.photoGallery.titleLead}{" "}
            <span className="text-accent-light">{t.photoGallery.titleAccent}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            {t.photoGallery.description}
          </p>
        </div>
      </section>

      <Breadcrumbs items={[{ label: t.photoGallery.breadcrumb }]} />

      <section className="bg-band/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <GalleryGrid images={images} />
        </div>
      </section>
    </>
  );
}
