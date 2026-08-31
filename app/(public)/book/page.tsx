import type { Metadata } from "next";
import { getActiveVehicles } from "@/lib/data/vehicles";
import { getSettings } from "@/lib/data/settings";
import { isPromoLive } from "@/lib/types";
import { getActiveOffices } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageIntro } from "@/components/site/PageIntro";
import { TbCalendarCheck } from "react-icons/tb";
import { BookingWizard } from "@/components/site/BookingWizard";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.book.metaTitle,
    description: t.book.metaDescription,
    alternates: { canonical: "/book" },
  };
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; mode?: string }>;
}) {
  const { t } = await getI18n();
  const [{ vehicle: vehicleSlug, mode }, vehicles, settings, offices] = await Promise.all([
    searchParams,
    getActiveVehicles(),
    getSettings(),
    getActiveOffices(),
  ]);

  const initialVehicle = vehicleSlug ? vehicles.find((v) => v.slug === vehicleSlug) : undefined;
  // Self-drive is only offered when the line is enabled, whatever the query says.
  const initialMode =
    settings.selfDriveEnabled && mode === "self-drive" ? "self-drive" : "chauffeur";
  const cities = offices.map((o) => o.city);

  return (
    <>
      <PageIntro
        icon={TbCalendarCheck}
        eyebrow={t.book.eyebrow}
        title={t.book.title}
        description={t.book.description}
      />
      <Breadcrumbs items={[{ label: t.book.breadcrumb }]} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {vehicles.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.book.empty}</p>
        ) : (
          <BookingWizard
            vehicles={vehicles}
            initialVehicleId={initialVehicle?.id ?? vehicles[0]?.id ?? ""}
            initialMode={initialMode}
            selfDriveEnabled={settings.selfDriveEnabled}
            cities={cities}
            helpline={settings.helplineNumbers[0] ?? ""}
            whatsapp={settings.whatsappNumber}
            promoCode={isPromoLive(settings.promo) ? (settings.promo?.code ?? "") : ""}
          />
        )}
      </div>
    </>
  );
}
