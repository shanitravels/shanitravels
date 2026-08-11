# Shani Travels — Website & Admin CMS

The production website for **Shani Travels (Car Rental)**, Islamabad — a chauffeur-driven car rental and ground-transport company operating since 1997 as part of the Shani Group.

It is a fully database-driven site with a complete admin CMS: every piece of content and media on the public site is managed from `/admin`, with zero developer involvement. Change a rate, upload a vehicle with photos, reorder the client wall, or update the helpline — all from the dashboard, all live on the public site immediately.

It covers a 43-vehicle catalog with **B-6 armored** and **logistics** classes, a 13-service taxonomy grouped by audience plus **12 industry landing pages** (the sector SEO play), and a **self-drive** line offered on the everyday classes (Economy, Sedan, SUV / 4x4).

Every booking and enquiry notifies the team by email, prefills a WhatsApp message with the full request, and adds the customer's address to a **mailing list** for offer campaigns.

The site serves two customers through a deliberate **dual-path architecture**:

- **Retail** (airport transfers, weddings, family trips) → fleet + transparent rates → a booking request.
- **Corporate / institutional** (UN agencies, donors, NGOs, telecom, government) → capability, credentials & references → a proposal request.

Payments are deferred by decision: bookings are requests confirmed by phone/WhatsApp; corporate work is contracted. The booking model is structured so a payment step can be inserted later without schema changes.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **MongoDB Atlas + Mongoose** (cached connection for serverless)
- **Auth**: `jose`-signed JWT session cookie + `bcryptjs`, guarded by `proxy.ts` (Next 16's renamed middleware) and re-checked server-side in every action
- **Cloudinary** for all media — signed, folder-scoped uploads from the admin panel; a custom `next/image` loader delivers `f_auto,q_auto` responsive images
- **Zod** validation on every form and server action (client + server)
- Server Components by default; **Server Actions** for all mutations
- Public reads cached with `unstable_cache` + tags; every mutation calls `revalidateTag()` so the public site updates on the next request

---

## Getting started

### 1. Prerequisites

- Node.js **20.9+**
- A **MongoDB Atlas** cluster (free tier is fine)
- A **Cloudinary** account (free tier is fine) — optional for local dev, required for uploads

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string (include the DB name, e.g. `.../shani-travels`) |
| `NEXTAUTH_SECRET` | Secret for signing admin sessions — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical site URL, no trailing slash (used for metadata, sitemap, OG) |
| `ADMIN_EMAIL` | First admin user's email (created by the seed) |
| `ADMIN_PASSWORD` **or** `ADMIN_PASSWORD_HASH` | First admin's password. Set `ADMIN_PASSWORD` for convenience, or precompute a bcrypt hash into `ADMIN_PASSWORD_HASH` for production |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for signed uploads |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name exposed to the browser for delivery URLs |
| `RESEND_API_KEY` / `OPS_NOTIFY_EMAIL` / `RESEND_FROM` | *(optional)* Email the team on every new booking, corporate enquiry and contact message. In-app badges are the source of truth; leave blank to disable. |

To precompute a password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
```

### 4. Seed the database

Populates one admin user, the 43-vehicle fleet (2026 rates where published), 8 offices, ~27 clients, 6 testimonials, 13 grouped services, 12 industry landing pages, the full safety protocol, and site settings:

```bash
npm run seed          # fills empty collections (safe to re-run)
npm run seed -- --force   # wipes & reseeds content collections
```

> Seed contact details, addresses and phone numbers are **placeholders** — update the real ones from **Admin → Settings** and **Admin → Offices** after first run.

### 5. Run

```bash
npm run dev
```

- Public site: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin> (sign in with `ADMIN_EMAIL` + your password)

### 6. Build

```bash
npm run build && npm start
```

> **Note on memory:** Mongoose's type definitions are heavy. If `next build` runs out of memory on a low-RAM machine during the TypeScript step, raise Node's heap: `NODE_OPTIONS=--max-old-space-size=5120 npm run build`.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run seed` | Seed the database (append `-- --force` to reset) |
| `npm run db:check` | Verify `MONGODB_URI` connects; print document counts per collection |
| `npm run db:verify` | Audit content — services by group, fleet by class, industries |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Project structure

```
app/
  (public)/          Public site — grouped so it shares the header/footer chrome
    page.tsx         Home (dual-path hero, fleet strip, trust, clients, testimonials)
    fleet/           Catalog + [slug] vehicle detail
    rates/           Rate card + fare estimator
    corporate/       Capability + credentials + proposal form
    industries/      Index + [slug] per-industry landing pages (SEO)
    safety/          The published security protocol
    self-drive/      Self-drive service page (hidden until enabled)
    services/, clients/, network/, about/, contact/, book/
  admin/
    login/           Standalone sign-in
    (panel)/         Authenticated CMS shell
      bookings/[id]/ Booking detail + self-drive verification checklist
      mailing-list/  Collected addresses for offer campaigns
      industries/, safety/                  content editors
  sitemap.ts, robots.ts, not-found.tsx, global-error.tsx
components/
  site/              Public UI (Header, Footer, VehicleCard, BookingWizard, …)
  admin/             CMS UI (managers, forms, tables)
  ui/                Shared primitives (Button, Reveal, Counter)
lib/
  models.ts          Mongoose schemas — the single source of truth
  types.ts           Serialized domain types + enums, self-drive eligibility
  validation.ts      Zod schemas (mirror the Mongoose constraints)
  data/              Cached public reads + uncached admin reads
  actions/           Server Actions (auth, vehicles, content, settings, users,
                     media, requests, public, marketing)
  auth/session.ts    jose sessions + requireAdmin gate
  cloudinary.ts      Signed uploads, media listing, guarded deletion
  email.ts           Env-gated Resend notifications
  marketing.ts       Mailing-list capture (never throws into a booking)
  whatsapp.ts        Booking → prefilled WhatsApp message
scripts/
  seed.ts            Database seed
  data/              Seed content (fleet, services, industries, safety)
proxy.ts             Session route guard (Next 16 middleware)
```

---

## Access

A single **admin** role with full access, checked in `proxy.ts` (route level) **and**
re-checked in `requireAdmin()` inside every server action and page — the client is
never trusted.

The earlier editor/ops/driver tiers existed only to scope access to the
field-operations module (driver roster, inspections, incidents, handovers), which
has been removed. `requireRole()` still takes a role list, so re-introducing a tier
later is a types-only change.

---

## How a lead is handled

**Every booking and enquiry does three things at once.** It is written to the
database and appears in `/admin` with a sidebar badge; it emails the address in
`OPS_NOTIFY_EMAIL` with the full request (when `RESEND_API_KEY` is set); and the
customer's email address is added to the **mailing list** for offer campaigns.

**WhatsApp handover.** After a booking is saved, the confirmation page offers a
prefilled WhatsApp message containing the whole request — reference, vehicle,
dates, pickup city, fare and contact details. It is a click-to-chat link, so the
message reaches the team only when the customer taps send; the database record
and the notification email do not depend on it.

**Mailing list.** Addresses are captured automatically, deduplicated
case-insensitively, and tagged with the form they came from. Opting someone out is
permanent — a later booking will **not** silently resubscribe them. Filter to
**Subscribed** and use *Copy* or *CSV* to feed a campaign tool.

**Self-drive.** Offered on Economy, Sedan and SUV / 4x4 only — enforced in
`isSelfDriveEligible()` (`lib/types.ts`), applied in the UI, in the admin vehicle
form, and re-checked server-side so a forged request cannot self-drive-book an
armored car or a coach. The whole line also ships behind *Settings → Self-drive
service line*; until that is on, the server rejects self-drive bookings outright.
**Confirm insurance coverage for self-drive rentals before enabling** (see Open
questions below).

On a self-drive booking, the admin works a **verification checklist** (CNIC ·
licence · agreement · declaration — each tick stamped with who and when) from the
booking record.

---

## Content-editing guide (for the Shani Travels team)

Everything below is managed from **`/admin`** — no developer needed. Changes appear on the public site immediately.

- **Dashboard** — new bookings & enquiries at a glance; advance a request's status in one click.
- **Vehicles** — add/edit vehicles, upload photos (drag to reorder, first is the cover), set specs and rates. Leave a rate blank for **"on request"**. Set an **armor level** (B-6 is the fleet standard) and toggle **self-drive availability** with its own rates and deposit (offered on Economy, Sedan and SUV / 4x4 only — the toggle is hidden on other classes). **Featured** shows on the homepage; **Active** controls visibility. Deactivate rather than delete; deletion is blocked while bookings reference a vehicle.
- **Rates** — a spreadsheet-style grid of every active vehicle. Edit any cell, hit **Save all**. **Export CSV** for circulating the rate sheet.
- **Bookings** — retail and self-drive requests, filterable by **service mode**. Open a booking for the full record: status, internal notes, and the self-drive verification checklist.
- **Enquiries** — corporate proposals and general contact messages, with their own pipeline.
- **Mailing list** — every email address collected from bookings and enquiries, with its source and request count. Toggle a customer off to honour an opt-out. Filter to **Subscribed**, then **Copy** or **CSV** to run an offer campaign. Export follows the filter, so an opt-out cannot leak into a send.
- **Clients** — the trusted-by wall. Upload logos (transparent PNG works best), set the sector, toggle Featured/Active.
- **Testimonials** — short paraphrased quotes from appreciation letters (character-counted).
- **Services** — 13 services in three audience **groups** (organizations / individuals / specialized). Markdown body, image, and related vehicle classes that populate the service page.
- **Industries** — the 12 sector landing pages. Each has a summary, a Markdown body, a hero image, related services and vehicle classes, a testimonial sector (which pulls matching clients and quotes onto the page), and its own **SEO title & description**. These pages target sector search queries — edit the copy freely, but keep each SEO description distinct.
- **Safety** — the published security protocol, grouped into chauffeur / self-drive / general. Each section is a title, an intro and one bullet per line. Changes appear on `/safety` immediately; the self-drive section stays hidden until the self-drive line is enabled.
- **Offices** — the city network; mark exactly one office as the head office.
- **Media** — every image uploaded through the dashboard. Copy URLs, or delete unused assets (blocked while an asset is still referenced, and it tells you where).
- **Settings** *(admin role)* — contact numbers & socials, the hero, the announcement bar, the **self-drive launch switch**, stats, credentials/certificates, commercial terms, the About page content, and SEO defaults. Saving refreshes the whole public site.
- **Users** *(admin role)* — invite teammates, reset passwords, deactivate accounts. Everyone who can sign in is an admin.

---

## Open questions for the owners

These need business answers, not code:

1. **Self-drive insurance.** The company profile states fleet insurance is valid on a *chauffeur-driven* basis. Confirm coverage extends to self-drive rentals before enabling the line — this is a legal exposure question. The feature is built and shipped dark behind the Settings toggle so it can be switched on the day that is confirmed.
2. **Self-drive rates and deposits.** None are published, so every self-drive vehicle currently shows **"on request"** and the deposit reads *"confirmed at booking"*. Add real figures per vehicle in **Admin → Vehicles → Self-drive**.
3. **Self-drive eligibility.** Restricted to Economy, Sedan and SUV / 4x4. Within those classes it is still a per-vehicle toggle — currently 4 economy cars and 2 sedans are marked eligible, and no SUV yet. Confirm the intended starting list.

---

## Deploying to Vercel

1. Push the repo to GitHub and import it into Vercel.
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables** (set `NEXTAUTH_URL` to the production domain).
3. **MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0`.** Do this *before* deploying. Serverless platforms use dynamic IPs, so there is no fixed address to allow-list; security comes from the database user's credentials. This is the single most common cause of a deployed-but-empty site.
4. Deploy. On the first deploy, run the seed once against the production database from your machine with the production `MONGODB_URI` in `.env.local`: `npm run seed`.
5. Confirm the deployment can reach the database: open **`https://your-domain/api/health`**. It reports connection status, vehicle counts and which env vars are set — without exposing credentials.

### Troubleshooting: the site deploys but shows no vehicles

The public pages are statically generated at build time and degrade to empty content when the database is unreachable (so a build never hard-fails). That means a connection problem looks like *missing content* rather than an error.

1. Open `/api/health` on the deployed site. If `ok: false`, it names the likely cause.
2. Fix the cause — almost always Atlas Network Access (step 3 above) or a missing/incorrect `MONGODB_URI`.
3. **Redeploy.** This matters: pages baked empty at build time keep serving that empty version until they revalidate (up to an hour). A fresh deploy regenerates them immediately.

The build log also prints a large `DATABASE UNREACHABLE` banner when this happens — check it before assuming the data is missing.

### Troubleshooting: an edit isn't showing up

Content edited through `/admin` calls `revalidateTag()` and appears immediately. Edits written **directly to MongoDB by a script** (`npm run seed`, `scripts/set-contact.ts`, the migrations) bypass that invalidation, so cached pages keep serving the old value for up to an hour.

Fastest fix — purge on demand, no redeploy needed:

```bash
# one collection
curl -X POST "https://your-domain/api/revalidate?tag=vehicles&secret=$REVALIDATE_SECRET"
# everything
curl -X POST "https://your-domain/api/revalidate?secret=$REVALIDATE_SECRET"
```

A signed-in admin can call it without the secret. Locally, deleting `.next/cache` and rebuilding does the same.

### A note on how caching fails safely

Public reads are wrapped by `cachedRead` (`lib/data/cache.ts`), which exists to enforce one rule: **a failed database read is never cached.** The read function is allowed to throw, so `unstable_cache` stores nothing, and the empty-state fallback is applied outside the cache. Without this, one transient outage would blank the site for the entire revalidate window — and because some hosts keep their data cache across deployments, a redeploy wouldn't clear it either.

If a bad value ever does get cached, bump `CACHE_VERSION` in that file to orphan every existing entry on the next deploy.

---

## Security notes

- Every admin mutation authorizes server-side (session + role) — the client is never trusted.
- **The site never collects identity documents online.** Self-drive CNIC/passport and licence are verified *in person* at handover; the booking stores only admin-side verification booleans. This is deliberate — do not add document uploads to the public flow.
- Drivers are scoped server-side to their own assignments: filing a pre-trip check for someone else's booking is rejected in both the page and the action.
- Cloudinary uploads are signed, folder-scoped, and size/type-limited; the API secret never reaches the browser.
- Public forms are Zod-validated server-side, rate-limited by IP, and honeypot-protected.
- Unique indexes on slugs, emails and references; Mongoose schema validation mirrors Zod.
