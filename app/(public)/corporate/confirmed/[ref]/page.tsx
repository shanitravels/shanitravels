import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { Confirmation } from "@/components/site/Confirmation";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.confirmation.proposalReceived,
    robots: { index: false, follow: false },
  };
}

export default async function CorporateConfirmedPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { t } = await getI18n();
  const [{ ref }, settings] = await Promise.all([params, getSettings()]);
  return (
    <Confirmation
      reference={ref}
      title={t.confirmation.proposalReceived}
      message={t.confirmation.proposalMessage}
      helpline={settings.helplineNumbers[0] ?? ""}
      whatsapp={settings.whatsappNumber}
    />
  );
}
