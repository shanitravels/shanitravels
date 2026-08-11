import type { Metadata } from "next";
import { getActiveClients, getActiveTestimonials } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { SectionHead, ClientWall, TestimonialsGrid } from "@/components/site/sections";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.clients.metaTitle,
    description: t.clients.metaDescription,
    alternates: { canonical: "/clients" },
  };
}

export default async function ClientsPage() {
  const { t } = await getI18n();
  const [clients, testimonials] = await Promise.all([
    getActiveClients(),
    getActiveTestimonials(),
  ]);

  return (
    <>
      <PageIntro
        eyebrow={t.clients.eyebrow}
        title={t.clients.title}
        description={t.clients.description}
      />
      <Breadcrumbs items={[{ label: t.footer.clients }]} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <ClientWall clients={clients} grouped />
      </section>

      {testimonials.length > 0 && (
        <section className="bg-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHead
              eyebrow={t.clients.testimonialsEyebrow}
              title={t.clients.testimonialsTitle}
              description={t.clients.testimonialsDesc}
            />
            <div className="mt-10">
              <TestimonialsGrid testimonials={testimonials} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
