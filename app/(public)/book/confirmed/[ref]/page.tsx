import type { Metadata } from "next";
import { FiKey } from "react-icons/fi";
import { getSettings } from "@/lib/data/settings";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models";
import { Confirmation } from "@/components/site/Confirmation";
import { bookingWhatsAppMessage, type BookingWhatsAppFields } from "@/lib/whatsapp";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.confirmation.bookingReceived,
    robots: { index: false, follow: false },
  };
}

/**
 * The saved booking, used both for the self-drive copy and to build the
 * WhatsApp handover message. Returns null for the honeypot reference (which
 * never writes a record) and whenever the read fails — the page still renders,
 * just without the prefilled message.
 */
async function loadBooking(reference: string): Promise<BookingWhatsAppFields | null> {
  try {
    await connectDB();
    const doc = await BookingModel.findOne({ reference })
      .select(
        "reference vehicleName serviceMode rateType startDate endDate pickupCity name phone email notes indicativeFare promoCode"
      )
      .lean();
    return (doc as BookingWhatsAppFields | null) ?? null;
  } catch {
    return null;
  }
}

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { t } = await getI18n();
  const [{ ref }, settings] = await Promise.all([params, getSettings()]);
  const booking = await loadBooking(ref);
  const selfDrive = booking?.serviceMode === "self-drive";
  const whatsappText = booking ? bookingWhatsAppMessage(booking) : undefined;

  return (
    <>
      <Confirmation
        reference={ref}
        title={t.confirmation.bookingReceived}
        message={
          selfDrive
            ? t.confirmation.bookingMessageSelfDrive
            : t.confirmation.bookingMessage
        }
        helpline={settings.helplineNumbers[0] ?? ""}
        whatsapp={settings.whatsappNumber}
        whatsappText={whatsappText}
        autoOpenWhatsApp
      />
      {selfDrive && (
        <div className="mx-auto -mt-8 mb-16 max-w-xl px-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-emerald-900">
              <FiKey className="h-4 w-4" /> {t.confirmation.bringTitle}
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/80">
              <li>• {t.confirmation.bringCnic}</li>
              <li>• {t.confirmation.bringLicence}</li>
              <li>• {t.confirmation.bringDeposit}</li>
              <li>• {t.confirmation.bringInspection}</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
