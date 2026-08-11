import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Env-gated email notifications for new bookings, enquiries and contact
 * messages.
 *
 * Two transports are supported, picked in this order:
 *
 *   1. SMTP via nodemailer — active when SMTP_USER and SMTP_PASS are set.
 *      Defaults target Gmail, which requires an App Password (a normal account
 *      password is rejected, and the account needs 2-Step Verification on).
 *   2. Resend's REST API — active when RESEND_API_KEY is set.
 *
 * In-app sidebar badges remain the source of truth; email is a convenience.
 * When neither transport is configured this is a silent no-op, and failures are
 * logged rather than thrown — a bounced notification must never cost us the
 * lead by breaking the customer's form submission.
 */

const globalWithMailer = globalThis as typeof globalThis & {
  __mailer?: Transporter;
};

/**
 * Built once and reused across dev hot reloads and warm invocations.
 *
 * Deliberately unpooled: a pooled transport keeps SMTP sockets open, which
 * survives neither a frozen serverless function nor a clean process exit, and
 * notification volume here is far too low to need connection reuse.
 */
function getTransporter(): Transporter | null {
  const user = process.env.SMTP_USER;
  // Google shows App Passwords in spaced groups of four; the spaces are
  // presentational and must not be sent as part of the secret.
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (!user || !pass) return null;

  if (globalWithMailer.__mailer) return globalWithMailer.__mailer;

  const port = Number(process.env.SMTP_PORT ?? 465);

  globalWithMailer.__mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    // Give up rather than hold a request open if Gmail is slow to answer.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  return globalWithMailer.__mailer;
}

function sendViaSmtp(
  transporter: Transporter,
  to: string[],
  subject: string,
  body: string
): void {
  const from = process.env.MAIL_FROM || `Shani Travels <${process.env.SMTP_USER}>`;

  // Fire-and-forget: don't block the server action on the SMTP round trip.
  void transporter
    .sendMail({ from, to, subject, text: body })
    .then((info) => {
      const failed = info.rejected?.length ? ` (rejected: ${info.rejected.join(", ")})` : "";
      console.log(`[email] sent "${subject}" to ${to.join(", ")} ${info.messageId}${failed}`);
    })
    .catch((err: unknown) => {
      console.error(
        `[email] SMTP send failed for "${subject}":`,
        err instanceof Error ? err.message : err
      );
    });
}

function sendViaResend(apiKey: string, to: string[], subject: string, body: string): void {
  const from = process.env.RESEND_FROM || "Shani Travels Ops <onboarding@resend.dev>";

  void fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  })
    .then(async (res) => {
      if (!res.ok) console.error("[email] Resend rejected:", res.status, await res.text());
    })
    .catch((err) => console.error("[email] send failed:", err));
}

export function notifyOps(subject: string, body: string): void {
  // OPS_NOTIFY_EMAIL takes one address or several, comma-separated.
  const to = (process.env.OPS_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (to.length === 0) return;

  const transporter = getTransporter();
  if (transporter) {
    sendViaSmtp(transporter, to, subject, body);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) sendViaResend(apiKey, to, subject, body);
}
