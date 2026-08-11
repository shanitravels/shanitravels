import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { VehicleModel, SettingsModel } from "@/lib/models";

/**
 * Deployment diagnostic: `GET /api/health`.
 *
 * Answers the question "can this deployment actually reach the database?"
 * without exposing credentials. The public pages degrade to empty content when
 * the database is unreachable (so builds never hard-fail), which makes a
 * misconfiguration look like missing content — this endpoint tells the truth.
 */
export const dynamic = "force-dynamic";

/** Never leak the password; show only enough to confirm the right cluster. */
function describeUri(uri: string | undefined): string {
  if (!uri) return "NOT SET";
  const m = uri.match(/^mongodb(\+srv)?:\/\/([^:]+):[^@]+@([^/?]+)\/([^?]*)/);
  if (!m) return "set (unrecognised format)";
  const [, , user, host, db] = m;
  return `${user}:****@${host}/${db || "(no database name)"}`;
}

export async function GET() {
  const checks = {
    MONGODB_URI: describeUri(process.env.MONGODB_URI),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "NOT SET",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "set" : "not set",
  };

  const started = Date.now();
  try {
    await connectDB();
    const [vehicles, activeVehicles, settings] = await Promise.all([
      VehicleModel.countDocuments(),
      VehicleModel.countDocuments({ active: true }),
      SettingsModel.countDocuments(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        database: {
          connected: true,
          name: mongoose.connection.name,
          latencyMs: Date.now() - started,
          vehicles,
          activeVehicles,
          settings,
        },
        env: checks,
        hint:
          activeVehicles === 0
            ? "Connected, but no active vehicles — run `npm run seed` against this database."
            : "Healthy.",
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // The two failure modes that actually happen in production.
    const likelyCause = /tlsv1|ssl|ETIMEDOUT|ECONNREFUSED|querySrv|ENOTFOUND|whitelist|not allowed/i.test(
      message
    )
      ? "The database refused or dropped the connection. Most often this is MongoDB Atlas → Network Access: the host's IP range is not allow-listed. Serverless platforms use dynamic IPs, so add 0.0.0.0/0 (allow access from anywhere) and rely on the database user's credentials for security."
      : "Check that MONGODB_URI is set correctly in the deployment's environment variables (including the database name), and that the database user has readWrite access.";

    return NextResponse.json(
      {
        ok: false,
        database: { connected: false, latencyMs: Date.now() - started, error: message },
        env: checks,
        likelyCause,
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
