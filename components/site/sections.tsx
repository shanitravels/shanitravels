import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiBriefcase, FiCreditCard, FiShield } from "react-icons/fi";
import Counter from "@/components/ui/Counter";
import Reveal from "@/components/ui/Reveal";
import type {
  Client,
  Discount,
  MediaImage,
  SiteSettings,
  Testimonial,
  Vehicle,
  VehicleClass,
} from "@/lib/types";
import { isDiscountLive } from "@/lib/pricing";
import { getI18n } from "@/lib/i18n/server";

/** Section shell with an eyebrow + heading, reused across public pages. */
export function SectionHead({
  eyebrow,
  title,
  description,
  light = false,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            center ? "justify-center" : ""
          } ${light ? "text-white/70" : "text-accent"}`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-base leading-relaxed ${light ? "text-white/70" : "text-muted"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Stats trust band, e.g. "Since 1997 · 8 cities · 120 vehicles". */
export async function TrustBand({ settings }: { settings: SiteSettings }) {
  const { t } = await getI18n();
  const items = [
    { value: settings.stats.yearsOperating, suffix: "+", label: t.sections.statYears },
    { value: settings.stats.cities, suffix: "", label: t.sections.statCities },
    ...(settings.stats.fleetSize
      ? [{ value: settings.stats.fleetSize, suffix: "+", label: t.sections.statFleet }]
      : []),
    { value: 24, suffix: "/7", label: t.sections.statOps },
  ];
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-heading text-3xl font-bold text-navy sm:text-4xl">
              <Counter value={item.value} suffix={item.suffix} />
            </p>
            <p className="mt-1 text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * A row of client logos, centred.
 *
 * Wrapped rather than laid out on a six-column grid. Every wall on the site is
 * a filtered slice of the client list — one sector, one page's featured few —
 * and none of those slices divides by six, so the grid left the last one or two
 * logos jammed against the left with a hole beside them under a centred
 * heading. A full row looks identical either way; only the short ones change.
 *
 * The widths mirror what the grid's columns were (2 / 3 / 4 / 6 up the
 * breakpoints), each subtracting the row's share of the 0.75rem gap —
 * gap × (columns − 1) ÷ columns — rounded up so a sub-pixel rounding error can
 * never wrap a logo a row early.
 */
function LogoRow({ clients }: { clients: Client[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {clients.map((c) => (
        <div
          key={c.id}
          className="w-[calc(50%-0.38rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.57rem)] lg:w-[calc(16.666%-0.63rem)]"
        >
          <ClientLogo client={c} />
        </div>
      ))}
    </div>
  );
}

/** The trusted-by client wall. Grouped grid of logos / names. */
export async function ClientWall({
  clients,
  grouped = false,
}: {
  clients: Client[];
  grouped?: boolean;
}) {
  if (clients.length === 0) return null;
  const { t } = await getI18n();

  if (!grouped) return <LogoRow clients={clients} />;

  const sectors = Array.from(new Set(clients.map((c) => c.sector)));
  return (
    <div className="space-y-8">
      {sectors.map((sector) => (
        <div key={sector}>
          <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
            {t.clientSector[sector]}
          </h3>
          <LogoRow clients={clients.filter((c) => c.sector === sector)} />
        </div>
      ))}
    </div>
  );
}

function ClientLogo({ client }: { client: Client }) {
  return (
    // Logos keep their own colours — these are the marks of UN agencies, banks
    // and telecoms, and desaturating them made the wall read as a placeholder.
    // The lift is on the card rather than the image so the border and shadow
    // scale with it; `motion-reduce` opts out for anyone who asked it to.
    <div className="flex h-20 items-center justify-center rounded-xl border border-line bg-white px-3 text-center shadow-card transition duration-200 ease-out hover:scale-[1.04] hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:scale-100">
      {client.logo ? (
        <div className="relative h-12 w-full">
          <Image
            src={client.logo.url}
            alt={client.logo.alt || client.name}
            fill
            className="object-contain"
            sizes="160px"
          />
        </div>
      ) : (
        <span className="text-sm font-semibold text-navy/70">{client.name}</span>
      )}
    </div>
  );
}

/** Testimonials grid of quote cards. */
export async function TestimonialsGrid({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const { t } = await getI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((item, i) => (
        <Reveal key={item.id} delay={i * 60} as="div">
          <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
            <span className="font-heading text-4xl leading-none text-accent/30">“</span>
            <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{item.quote}</blockquote>
            <figcaption className="mt-4 border-t border-line pt-3">
              <p className="text-sm font-semibold text-navy">{item.organization}</p>
              <p className="text-xs text-muted">
                {t.clientSector[item.sector]}
                {item.year ? ` · ${item.year}` : ""}
              </p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * First vehicle photograph from the preferred classes, in order.
 *
 * The showcase below is editorial — each card wants a picture of the kind of
 * vehicle it is selling — but the fleet is admin-managed, so no class is
 * guaranteed to exist or to carry images. Hence the ordered preference, the
 * any-vehicle fallback, and finally `null`, which the card renders as a plain
 * navy panel rather than a broken frame.
 */
function pickArt(vehicles: Vehicle[], classes: VehicleClass[]): MediaImage | null {
  for (const cls of classes) {
    const match = vehicles.find((v) => v.class === cls && v.images.length > 0);
    if (match) return match.images[0];
  }
  return vehicles.find((v) => v.images.length > 0)?.images[0] ?? null;
}

/** One editorial tile in the offer showcase. */
function OfferCard({
  href,
  title,
  body,
  art,
  badge,
  large = false,
}: {
  href: string;
  title: string;
  body: string;
  /** Only the two fields the tile draws — a settings image carries no `order`,
   *  a fleet photograph does, and the tile has no use for it either way. */
  art: Pick<MediaImage, "url" | "alt"> | null;
  badge?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-navy-light ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        large ? "min-h-[19rem] lg:row-span-2 lg:min-h-[27rem]" : "min-h-[13rem]"
      }`}
    >
      {art ? (
        <Image
          src={art.url}
          alt={art.alt || title}
          fill
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          sizes={large ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 40vw"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy-deep" />
      )}

      {/* Two stops, not one: a light flat wash ties the tile to the navy band
          while the bottom ramp — and only the bottom ramp — carries the text.
          Pushing the wash any darker buys legibility the ramp already provides
          and costs the photograph, which is the reason the tile exists.

          The ramp is placed off the bottom edge rather than stretched over the
          tile. Every tile sets its words the same distance up from that edge,
          but the short ones are a third of the tall one's height — measured as
          a fraction of the tile, the ramp arrives too late on them and the
          title lands on whatever the photograph happens to be doing there. */}
      <div className="absolute inset-0 bg-navy-deep/10" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-navy-deep via-navy-deep/75 via-40% to-transparent" />

      {badge && (
        <span className="absolute left-5 top-5 z-10 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_10px_24px_-12px_rgba(200,16,46,0.9)]">
          {badge}
        </span>
      )}

      <div className="relative z-10 mt-auto flex w-full items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <h3
            className={`text-balance font-heading font-bold uppercase tracking-[0.06em] text-white ${
              large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            }`}
          >
            {title}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">{body}</p>
        </div>
        {/* Decorative: the link is the whole tile and the heading already names
            where it goes, so a screen reader gains nothing from reading this. */}
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/35 bg-navy-deep/40 text-white backdrop-blur-sm transition duration-300 group-hover:border-accent group-hover:bg-accent"
        >
          <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Editorial offer showcase — the "why book now" band.
 *
 * Deliberately built from what the site already knows to be true (published
 * long-stay rates, the airport service, the office network) rather than from
 * invented campaign copy. A live discount only *decorates* the lead tile with
 * its badge; when none is running the section still stands up on its own.
 */
export async function OfferShowcase({
  vehicles,
  discounts,
  images,
}: {
  vehicles: Vehicle[];
  discounts: Discount[];
  /** Admin-chosen tile artwork; any slot left unset falls back to `pickArt`. */
  images?: SiteSettings["offerImages"];
}) {
  const { t } = await getI18n();
  const live = discounts.find((d) => isDiscountLive(d));

  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHead
          light
          eyebrow={t.home.offersEyebrow}
          title={t.home.offersTitle}
          description={t.home.offersDesc}
        />
        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          <OfferCard
            large
            href="/rates"
            badge={live?.label}
            title={t.home.offerLongTitle}
            body={t.home.offerLongDesc}
            art={images?.longHire ?? pickArt(vehicles, ["sedan", "economy", "suv"])}
          />
          <OfferCard
            href="/book"
            title={t.home.offerAirportTitle}
            body={t.home.offerAirportDesc}
            art={images?.airport ?? pickArt(vehicles, ["vip", "sedan", "suv"])}
          />
          <OfferCard
            href="/network"
            title={t.home.offerNationwideTitle}
            body={t.home.offerNationwideDesc}
            art={images?.nationwide ?? pickArt(vehicles, ["suv", "event", "logistics"])}
          />
        </div>

        {/* Below the tiles, not above them. It is the brightest thing in the
            band, and sitting between the heading and the offers it collected
            the click before the offers had been read — and left a pocket of
            empty navy on both sides of itself. Here it closes the section. */}
        <div className="mt-9 text-center">
          <Link
            href="/rates"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t.home.offersCta} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Benefits carried on a corporate account — the institutional counterpart to
 *  the retail offers above. */
const ACCOUNT_BENEFITS = [
  { icon: FiCreditCard, title: "accountBillingTitle", body: "accountBillingDesc" },
  { icon: FiBriefcase, title: "accountManagerTitle", body: "accountManagerDesc" },
  { icon: FiShield, title: "accountBackupTitle", body: "accountBackupDesc" },
] as const;

/**
 * Corporate-account band: one dark full-bleed frame carrying the headline, its
 * action, and the three benefits as panels over the same photograph.
 */
export async function CorporateAccountBand({ image }: { image?: MediaImage | null }) {
  const { t } = await getI18n();

  return (
    <section className="relative isolate overflow-hidden bg-navy-deep">
      {image && (
        <Image
          src={image.url}
          alt={image.alt || ""}
          fill
          className="object-cover object-[70%_center]"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/90 to-navy-deep/60" />
      <div className="absolute inset-0 bg-navy-deep/40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            <span className="h-px w-8 bg-accent" />
            {t.sections.accountEyebrow}
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold uppercase leading-[1.06] text-white sm:text-4xl lg:text-[2.85rem]">
            {t.sections.accountTitle}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
            {t.sections.accountDesc}
          </p>
          <Link
            href="/corporate"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(200,16,46,0.9)] transition hover:bg-accent-light"
          >
            {t.sections.accountCta} <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNT_BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="border-l-2 border-accent bg-white/[0.06] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
            >
              <span className="flex items-center gap-2.5 font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-white">
                <Icon className="h-4 w-4 text-accent-light" />
                {t.sections[title]}
              </span>
              <p className="mt-2.5 text-[13px] leading-relaxed text-white/65">{t.sections[body]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Final call-to-action band with dual paths. */
export async function CtaBand() {
  const { t } = await getI18n();

  return (
    <section className="bg-navy">
      <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          {t.sections.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          {t.sections.ctaBody}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            {t.sections.ctaBook} <FiArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/corporate"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t.sections.ctaProposal}
          </Link>
        </div>
      </div>
    </section>
  );
}
