/**
 * Change an admin account's sign-in email and/or password.
 *
 *   npx tsx scripts/set-admin-credentials.ts --email info@shanitravels.pk
 *   npx tsx scripts/set-admin-credentials.ts --password 'new-password'
 *   npx tsx scripts/set-admin-credentials.ts --email … --password … --from old@…
 *
 * The password is hashed with bcrypt at cost 12 — the same cost seed.ts uses —
 * before it goes anywhere near the database. Nothing plaintext is stored.
 *
 * Credentials are arguments, never literals in this file: a password committed
 * to the repository is disclosed to everyone with read access and stays in the
 * history after it is "removed". To keep it out of your shell history too, put
 * it in the environment instead:
 *
 *   ADMIN_NEW_PASSWORD='…' npx tsx scripts/set-admin-credentials.ts --email …
 *
 * With one admin account in the database, --from is optional and that account
 * is the one changed. With several, --from names which.
 *
 * Sessions already issued stay valid until they expire (7 days) — the JWT is
 * stateless and carries no password. Use --revoke to force a re-login by
 * rotating NEXTAUTH_SECRET instead; see the note printed on success.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { AdminUserModel } from "../lib/models";
import { applyDnsFallback } from "../lib/dns-fallback";

const BCRYPT_COST = 12;
const MIN_PASSWORD = 8;

interface Args {
  email?: string;
  password?: string;
  from?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") out.email = argv[++i];
    else if (arg === "--password") out.password = argv[++i];
    else if (arg === "--from") out.from = argv[++i];
    else usage(`Unrecognized argument: ${arg}`);
  }
  // The environment is the safer channel — it does not land in shell history.
  out.password ??= process.env.ADMIN_NEW_PASSWORD || undefined;
  return out;
}

function usage(message?: string): never {
  if (message) console.error(`\n${message}`);
  console.error(
    [
      "",
      "Usage: npx tsx scripts/set-admin-credentials.ts [options]",
      "",
      "  --email    <address>   new sign-in email",
      "  --password <password>  new password (or set ADMIN_NEW_PASSWORD)",
      "  --from     <address>   which account to change, if there are several",
      "",
    ].join("\n")
  );
  process.exit(1);
}

/** Deliberately advisory, not enforced — the operator owns this decision. */
function passwordConcerns(password: string, email: string): string[] {
  const notes: string[] = [];
  const domain = email.split("@")[1] ?? "";
  const local = email.split("@")[0] ?? "";
  const lower = password.toLowerCase();

  if (password.length < 12) notes.push("shorter than 12 characters");
  if (domain && lower.includes(domain.toLowerCase())) notes.push("contains the domain name");
  if (local && local.length > 3 && lower.includes(local.toLowerCase())) {
    notes.push("contains the email's local part");
  }
  if (!/[^A-Za-z0-9]/.test(password)) notes.push("no symbols");
  if (!/[A-Z]/.test(password)) notes.push("no uppercase letters");
  return notes;
}

async function main() {
  const { email, password, from } = parseArgs(process.argv.slice(2));
  if (!email && !password) usage("Nothing to change — pass --email, --password, or both.");

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    usage(`"${email}" does not look like an email address.`);
  }
  if (password && password.length < MIN_PASSWORD) {
    usage(`Password must be at least ${MIN_PASSWORD} characters (lib/validation.ts).`);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  applyDnsFallback();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✓ Connected. Database: ${mongoose.connection.name}\n`);

  const admins = await AdminUserModel.find({}).lean();
  if (admins.length === 0) {
    throw new Error("No admin users exist. Run `npm run seed` first.");
  }

  let target = admins[0];
  if (from) {
    const found = admins.find((u) => u.email === from.toLowerCase());
    if (!found) {
      throw new Error(
        `No admin with email "${from}". Existing: ${admins.map((u) => u.email).join(", ")}`
      );
    }
    target = found;
  } else if (admins.length > 1) {
    throw new Error(
      `${admins.length} admin accounts exist — pass --from to say which: ${admins
        .map((u) => u.email)
        .join(", ")}`
    );
  }

  const nextEmail = (email ?? target.email).toLowerCase();

  // The email is a unique index; catching the clash here gives a clear message
  // rather than a raw E11000 from the driver.
  if (email && nextEmail !== target.email) {
    const clash = admins.find((u) => u.email === nextEmail && String(u._id) !== String(target._id));
    if (clash) throw new Error(`Another admin account already uses "${nextEmail}".`);
  }

  const update: Record<string, unknown> = {};
  if (email) update.email = nextEmail;
  if (password) update.passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await AdminUserModel.updateOne({ _id: target._id }, { $set: update });

  console.log("Admin account updated");
  console.log(`  email     ${email ? `${target.email} → ${nextEmail}` : `${target.email} (unchanged)`}`);
  console.log(`  password  ${password ? `re-hashed (bcrypt, cost ${BCRYPT_COST})` : "unchanged"}`);

  if (password) {
    // Verify against what was actually written, not against the value in memory
    // — a silent write failure would otherwise lock the operator out.
    const saved = await AdminUserModel.findById(target._id).lean();
    const ok = await bcrypt.compare(password, (saved as { passwordHash: string }).passwordHash);
    console.log(`  verified  ${ok ? "new password authenticates ✓" : "MISMATCH — do not sign out!"}`);
    if (!ok) process.exitCode = 1;

    const notes = passwordConcerns(password, nextEmail);
    if (notes.length) {
      console.log(`\n  Note: this password is ${notes.join(", ")}.`);
      console.log("  Rerun with a stronger one whenever you like — this script is repeatable.");
    }
  }

  console.log(
    "\nSessions already signed in stay valid for up to 7 days; the token is stateless\n" +
      "and carries no password. To force every session to sign in again, rotate\n" +
      "NEXTAUTH_SECRET in the hosting environment and redeploy."
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
