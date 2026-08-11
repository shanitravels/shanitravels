/**
 * Notification delivery check.
 *
 *   npm run mail:test
 *
 * Sends one real message through the same notifyOps() path that booking,
 * corporate-enquiry and contact submissions use, so a green run here means
 * those forms will deliver too.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { applyDnsFallback } from "../lib/dns-fallback";
import { notifyOps } from "../lib/email";

async function main() {
  applyDnsFallback();

  const recipients = process.env.OPS_NOTIFY_EMAIL;
  if (!recipients) {
    console.error("✗ OPS_NOTIFY_EMAIL is not set — notifications are disabled.");
    console.error("  Add it to .env.local (comma-separated for several inboxes).");
    process.exit(1);
  }

  const transport = process.env.SMTP_USER
    ? `SMTP as ${process.env.SMTP_USER}`
    : process.env.RESEND_API_KEY
      ? "Resend API"
      : null;

  if (!transport) {
    console.error("✗ No transport configured. Set SMTP_USER/SMTP_PASS in .env.local.");
    process.exit(1);
  }

  console.log(`Transport:  ${transport}`);
  console.log(`Recipients: ${recipients}\n`);

  notifyOps(
    "Test — Shani Travels notification wiring",
    [
      "This is a test message confirming that booking leads, corporate",
      "enquiries and contact messages will be delivered to this inbox.",
      "",
      "Sent by `npm run mail:test`.",
    ].join("\n")
  );

  // notifyOps is deliberately fire-and-forget so form submissions never block
  // on SMTP; wait here so this script can report the outcome.
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log("\nIf no error appeared above, check the inboxes listed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
