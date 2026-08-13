import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { ALL_TAGS, type CacheTag } from "@/lib/tags";
import { getSession } from "@/lib/auth/session";

/**
 * On-demand cache purge: `POST /api/revalidate?tag=vehicles`
 * (omit `tag` to purge everything).
 *
 * Editing content in /admin already revalidates the right tags. This exists for
 * the cases that bypass that path — seed/migration scripts writing straight to
 * MongoDB, or a deployment that cached content while the database was
 * unreachable. Saves a redeploy.
 *
 * Authorised either by a signed-in admin session or, for scripting, the
 * `REVALIDATE_SECRET` env var sent as `?secret=` or `x-revalidate-secret`.
 */
export const dynamic = "force-dynamic";

async function authorize(req: NextRequest): Promise<boolean> {
  const session = await getSession();
  if (session && (session.role === "admin" || session.role === "editor")) return true;

  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false; // no secret configured → session is the only way in
  const provided =
    req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-revalidate-secret");
  return provided === expected;
}

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const requested = req.nextUrl.searchParams.get("tag");
  const tags: CacheTag[] =
    requested && (ALL_TAGS as string[]).includes(requested)
      ? [requested as CacheTag]
      : ALL_TAGS;

  // `{ expire: 0 }` rather than "max": this endpoint exists to force a bad entry
  // out, and stale-while-revalidate would keep serving exactly the value the
  // caller is trying to purge. `updateTag` is not an option here — Server
  // Actions only.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json(
    { ok: true, purged: tags, at: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } }
  );
}
