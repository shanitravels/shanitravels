import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveClients, getActiveTestimonials } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { TbUsersGroup } from "react-icons/tb";
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
  const [settings, clients, testimonials] = await Promise.all([
    getSettings(),
    getActiveClients(),
    getActiveTestimonials(),
  ]);

  // The whole page is a wall of client identities, so there is nothing left of
  // it to show while those are private — 404 rather than an empty shell.
  if (!settings.showClientIdentities) notFound();

  return (
    <>
      <PageIntro
        icon={TbUsersGroup}
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
