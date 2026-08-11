import Link from "next/link";
import { FiCheckCircle, FiPhone, FiHome } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { telHref, whatsappHref } from "@/lib/format";
import { WhatsAppHandoff } from "@/components/site/WhatsAppHandoff";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

/** Shared success screen for booking / enquiry / contact submissions. */
export async function Confirmation({
  reference,
  title,
  message,
  helpline,
  whatsapp,
  whatsappText,
  autoOpenWhatsApp = false,
}: {
  reference: string;
  title: string;
  message: string;
  helpline: string;
  whatsapp: string;
  /**
   * Prefilled WhatsApp body. When supplied, WhatsApp is promoted to the primary
   * action — the submission carries the full details, not just a reference.
   */
  whatsappText?: string;
  /** Attempt to open WhatsApp on load. Only meaningful with `whatsappText`. */
  autoOpenWhatsApp?: boolean;
}) {
  const { t } = await getI18n();
  const sendsDetails = Boolean(whatsappText);
  const waHref = whatsapp
    ? whatsappHref(
        whatsapp,
        whatsappText ?? fmt(t.confirmation.followUpMessage, { reference })
      )
    : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <FiCheckCircle className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
      <p className="mt-3 text-muted">{message}</p>

      <div className="mt-6 rounded-2xl border border-line bg-white px-6 py-4 shadow-card">
        <p className="text-xs uppercase tracking-wide text-muted">{t.confirmation.yourReference}</p>
        <p className="mt-1 font-heading text-2xl font-bold tracking-wide text-navy">{reference}</p>
      </div>

      {sendsDetails && waHref ? (
        <>
          {autoOpenWhatsApp && <WhatsAppHandoff href={waHref} />}
          <p className="mt-6 text-sm text-muted">
            {t.confirmation.preparedPrefix}{" "}
            {/* Say this plainly: a click-to-chat link only drafts the message.
                Nothing reaches the team until the customer taps send. */}
            <span className="font-semibold text-navy">
              {t.confirmation.tapSend}
            </span>
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="press-key mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white [--press-bg-down:#1da851] [--press-bg:#25D366] sm:w-auto"
          >
            <FaWhatsapp className="h-5 w-5" /> {t.confirmation.sendOnWhatsApp}
          </a>
        </>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        {sendsDetails
          ? t.confirmation.preferTalkShort
          : t.confirmation.preferTalkLong}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={telHref(helpline)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          <FiPhone className="h-4 w-4" /> {t.confirmation.callUs}
        </a>
        {/* Without details to send, WhatsApp stays a peer of Call. */}
        {!sendsDetails && waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            <FaWhatsapp className="h-4 w-4" /> {t.nav.whatsapp}
          </a>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-band"
        >
          <FiHome className="h-4 w-4" /> {t.nav.home}
        </Link>
      </div>
    </div>
  );
}
