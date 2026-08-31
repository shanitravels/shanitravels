import type { Metadata } from "next";
import { getActiveIndustries } from "@/lib/data/industries";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { TbBuildingFactory2 } from "react-icons/tb";
import { IndustryCards } from "@/components/site/IndustryCards";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.industries.metaTitle,
    description: t.industries.metaDescription,
    alternates: { canonical: "/industries" },
  };
}

export default async function IndustriesPage() {
  const { t } = await getI18n();
  const industries = await getActiveIndustries();

  return (
    <>
      <PageIntro
        icon={TbBuildingFactory2}
        eyebrow={t.industries.eyebrow}
        title={t.industries.title}
        description={t.industries.description}
      />
      <Breadcrumbs items={[{ label: t.nav.industries }]} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {industries.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.industries.empty}</p>
        ) : (
          <IndustryCards industries={industries} headingAs="h2" />
        )}
      </div>
    </>
  );
}
