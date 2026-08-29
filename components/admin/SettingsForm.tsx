"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiX, FiSave } from "react-icons/fi";
import { useToast } from "./Toast";
import { Field, TextInput, TextArea, Toggle, Button, LocalizedField } from "./form";
import { ImageManager, SingleImageField } from "./ImageManager";
import { saveSettings } from "@/lib/actions/settings";
import type { SiteSettingsDoc, HeroSlideDoc, CredentialDoc } from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";
import { isPromoLive } from "@/lib/types";

const emptyPair: LocalizedString = { en: "", ur: "" };

/**
 * What an empty line does. Nothing is substituted any more — each slide renders
 * exactly its own row — so the note says so plainly rather than naming a
 * fallback that no longer exists.
 */
function slideFieldHint(line: "eyebrow" | "title" | "body"): string {
  if (line === "title") return "Shown as the slide's heading. Leave blank and the slide shows no heading.";
  if (line === "body") return "Optional supporting sentence beneath the heading.";
  return "Small line above the heading.";
}

const blankPromo = {
  active: false,
  headline: emptyPair,
  message: emptyPair,
  code: "",
  ctaLabel: emptyPair,
  ctaHref: "/book",
  startDate: "",
  endDate: "",
};


type Img = { publicId: string; url: string; alt: string };

export function SettingsForm({ settings }: { settings: SiteSettingsDoc }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [helplines, setHelplines] = useState<string[]>(settings.helplineNumbers);
  const [emails, setEmails] = useState<string[]>(settings.emails);
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [address, setAddress] = useState(settings.headOfficeAddress);
  const [socials, setSocials] = useState(settings.socials);
  const [heroHeadline, setHeroHeadline] = useState(settings.heroHeadline);
  const [heroSub, setHeroSub] = useState(settings.heroSubheadline);
  const [heroImages, setHeroImages] = useState<HeroSlideDoc[]>(settings.heroImages);
  const [announce, setAnnounce] = useState(settings.announcementBar ?? { text: emptyPair, active: false });
  const [promo, setPromo] = useState(settings.promo ?? blankPromo);
  const [stats, setStats] = useState({
    yearsOperating: String(settings.stats.yearsOperating),
    cities: String(settings.stats.cities),
    fleetSize: settings.stats.fleetSize != null ? String(settings.stats.fleetSize) : "",
  });
  const [seo, setSeo] = useState({
    title: settings.seoDefaults.title,
    description: settings.seoDefaults.description,
    ogImage: settings.seoDefaults.ogImage
      ? { ...settings.seoDefaults.ogImage, alt: "" }
      : (null as Img | null),
  });
  const [offerImages, setOfferImages] = useState({
    longHire: (settings.offerImages?.longHire ?? null) as Img | null,
    airport: (settings.offerImages?.airport ?? null) as Img | null,
    nationwide: (settings.offerImages?.nationwide ?? null) as Img | null,
  });
  const [credentials, setCredentials] = useState<CredentialDoc[]>(settings.credentials);
  const [commercialTerms, setCommercialTerms] = useState(settings.commercialTerms);
  const [about, setAbout] = useState(settings.about);
  const [selfDriveEnabled, setSelfDriveEnabled] = useState(settings.selfDriveEnabled);

  const touch = () => setDirty(true);

  // Mirrors the visibility rule the public layout applies, so the editor can
  // see *why* a switched-on promo is not appearing instead of guessing.
  const promoLive = isPromoLive(promo) && Boolean(promo.message.en.trim());
  const promoWhyHidden = !promo.message.en.trim()
    ? "add a message."
    : promo.startDate && new Date(promo.startDate) > new Date()
      ? `it starts on ${promo.startDate}.`
      : "its end date has passed.";

  const save = () => {
    const payload = {
      helplineNumbers: helplines.filter(Boolean),
      whatsappNumber: whatsapp,
      emails: emails.filter(Boolean),
      headOfficeAddress: address,
      socials,
      heroHeadline,
      heroSubheadline: heroSub,
      heroImages,
      announcementBar: announce,
      promo,
      stats: {
        yearsOperating: stats.yearsOperating,
        cities: stats.cities,
        fleetSize: stats.fleetSize,
      },
      seoDefaults: {
        title: seo.title,
        description: seo.description,
        ogImage: seo.ogImage ? { publicId: seo.ogImage.publicId, url: seo.ogImage.url } : null,
      },
      offerImages,
      credentials,
      commercialTerms,
      about,
      selfDriveEnabled,
    };
    start(async () => {
      setErrors({});
      const res = await saveSettings(payload);
      if (res.ok) {
        setDirty(false);
        toast.success(res.message ?? "Saved");
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <Section title="Contact & socials">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Helpline and WhatsApp are independent: each drives its own button,
              so they can be two different numbers. The hints say so, because
              nothing else on screen makes the split obvious. */}
          <StringList
            label="Helpline numbers"
            hint="The first number is what every “Call us” button dials."
            values={helplines}
            onChange={(v) => { setHelplines(v); touch(); }}
            placeholder="+92 51 …"
          />
          <StringList label="Emails" values={emails} onChange={(v) => { setEmails(v); touch(); }} placeholder="info@…" />
          <Field
            label="WhatsApp number"
            hint="Where every WhatsApp button opens a chat. Independent of the helpline."
            error={errors.whatsappNumber}
          >
            <TextInput value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); touch(); }} />
          </Field>
          <Field label="Head office address" error={errors.headOfficeAddress} className="sm:col-span-2">
            <TextArea value={address} onChange={(e) => { setAddress(e.target.value); touch(); }} />
          </Field>
          <Field label="Facebook URL">
            <TextInput value={socials.facebook ?? ""} onChange={(e) => { setSocials({ ...socials, facebook: e.target.value }); touch(); }} />
          </Field>
          <Field label="Instagram URL">
            <TextInput value={socials.instagram ?? ""} onChange={(e) => { setSocials({ ...socials, instagram: e.target.value }); touch(); }} />
          </Field>
          <Field label="Pinterest URL" error={errors["socials.pinterest"]}>
            <TextInput
              placeholder="https://www.pinterest.com/shanitravels"
              value={socials.pinterest ?? ""}
              onChange={(e) => { setSocials({ ...socials, pinterest: e.target.value }); touch(); }}
            />
          </Field>
          <Field label="LinkedIn URL">
            <TextInput value={socials.linkedin ?? ""} onChange={(e) => { setSocials({ ...socials, linkedin: e.target.value }); touch(); }} />
          </Field>
        </div>
      </Section>

      <Section title="Hero">
        <div className="space-y-4">
          {/* These two used to be slide one's copy. Slide one now carries its
              own, like every other slide, so all these do is keep the homepage
              from rendering a wordless hero on a database with no slides in it
              — which the hints say outright, so nobody edits them expecting the
              first slide to change. */}
          <LocalizedField
            label="Headline (no-slides fallback)"
            hint="Only shown if there are no slides at all. To edit the first slide, use Slide 1 below."
            required
            error={errors.heroHeadline}
            value={heroHeadline}
            onChange={(v) => { setHeroHeadline(v); touch(); }}
          />
          <LocalizedField
            label="Subheadline (no-slides fallback)"
            hint="Only shown if there are no slides at all."
            multiline
            value={heroSub}
            onChange={(v) => { setHeroSub(v); touch(); }}
          />
          <Field label="Hero images (slider)">
            {/* ImageManager speaks MediaImage. It carries the slide copy through
                untouched — reorder, alt edits and removal all spread the item —
                but a freshly uploaded slide is built from the picture fields
                alone, so the blank pairs are seeded here. Spreading `img` last
                keeps the copy of every slide that already had some. */}
            <ImageManager
              value={heroImages}
              onChange={(v) => {
                setHeroImages(
                  v.map((img) => ({
                    eyebrow: emptyPair,
                    title: emptyPair,
                    body: emptyPair,
                    ...(img as Partial<HeroSlideDoc> & typeof img),
                  }))
                );
                touch();
              }}
              subfolder="hero"
            />
          </Field>

          {/* One block per slide, in the order the pictures are arranged above.
              Each block is the whole slide — its picture, that picture's alt
              text and the three lines laid over it — so a slide can be written
              in one place instead of half here and half in the picker. */}
          {heroImages.length > 0 && (
            <Field
              label="Slides"
              hint="Every slide's words live here and nothing is substituted for them: what you write is what the homepage shows, in the order the pictures are arranged above."
            >
              <div className="space-y-3">
                {heroImages.map((slide, i) => {
                  const patch = (next: Partial<HeroSlideDoc>) => {
                    setHeroImages(heroImages.map((s, idx) => (idx === i ? { ...s, ...next } : s)));
                    touch();
                  };
                  return (
                    <div
                      key={`${slide.publicId || slide.url}-${i}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.url}
                          alt=""
                          className="h-16 w-24 shrink-0 rounded-md border border-slate-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Slide {i + 1}
                            {i === 0 && " · also the page's H1"}
                          </p>
                          {/* The same value the picker above edits — bound to
                              the same state, so the two never disagree. Repeated
                              here so a slide reads as one unit. */}
                          <TextInput
                            className="mt-1.5"
                            value={slide.alt}
                            onChange={(e) => patch({ alt: e.target.value })}
                            placeholder="Image alt text — describes the picture for screen readers and search"
                          />
                          <p className="mt-1 text-xs text-slate-400">
                            Add or reorder pictures in “Hero images” above.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <LocalizedField
                          label="Eyebrow"
                          maxLength={90}
                          value={slide.eyebrow ?? emptyPair}
                          onChange={(eyebrow) => patch({ eyebrow })}
                          hint={slideFieldHint("eyebrow")}
                        />
                        <LocalizedField
                          label="Headline"
                          maxLength={160}
                          value={slide.title ?? emptyPair}
                          onChange={(title) => patch({ title })}
                          hint={slideFieldHint("title")}
                        />
                        <LocalizedField
                          label="Body"
                          multiline
                          rows={2}
                          maxLength={300}
                          value={slide.body ?? emptyPair}
                          onChange={(body) => patch({ body })}
                          hint={slideFieldHint("body")}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Field>
          )}
        </div>
      </Section>

      <Section
        title="Homepage offer tiles"
        subtitle='Artwork for the three tiles under "Plan your next journey". Leave one empty and it falls back to a fleet photograph of a fitting class. Wide landscape shots work best — the tiles crop to fill and the caption sits across the bottom.'
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Longer hire, lower day rate">
            <SingleImageField
              value={offerImages.longHire}
              onChange={(v) => { setOfferImages({ ...offerImages, longHire: v }); touch(); }}
              subfolder="offers"
              hint="The large tile on the left."
            />
          </Field>
          <Field label="Airport transfers">
            <SingleImageField
              value={offerImages.airport}
              onChange={(v) => { setOfferImages({ ...offerImages, airport: v }); touch(); }}
              subfolder="offers"
              hint="Top-right tile."
            />
          </Field>
          <Field label="City to city">
            <SingleImageField
              value={offerImages.nationwide}
              onChange={(v) => { setOfferImages({ ...offerImages, nationwide: v }); touch(); }}
              subfolder="offers"
              hint="Bottom-right tile."
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Self-drive service line"
        subtitle="Ships dark until insurance coverage for self-drive rentals is confirmed. Turning this on publishes /self-drive, the booking-flow option, and self-drive badges & rates."
      >
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
          <span className="text-sm text-slate-700">
            Self-drive is <strong>{selfDriveEnabled ? "LIVE" : "off (launched dark)"}</strong>
          </span>
          <Toggle checked={selfDriveEnabled} onChange={(v) => { setSelfDriveEnabled(v); touch(); }} label="Self-drive enabled" />
        </label>
      </Section>

      <Section title="Announcement bar">
        <div className="space-y-3">
          <LocalizedField
            label="Text"
            hint="Optional site-wide banner"
            value={announce.text}
            onChange={(text) => { setAnnounce({ ...announce, text }); touch(); }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Toggle checked={announce.active} onChange={(v) => { setAnnounce({ ...announce, active: v }); touch(); }} /> Show the announcement bar
          </label>
          {promoLive && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Hidden right now — the promo bar is live and takes the slot.
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Promo bar"
        subtitle="Campaign strip above the navbar. While it is live it replaces the announcement bar, so only one ever shows."
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Toggle
              checked={promo.active}
              onChange={(v) => {
                setPromo({ ...promo, active: v });
                touch();
              }}
            />
            Show the promo bar
          </label>

          {promo.active && !promoLive && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Switched on, but not showing — {promoWhyHidden}
            </p>
          )}

          <LocalizedField
            label="Badge"
            hint="Short label on the left, e.g. Limited time offer"
            maxLength={60}
            value={promo.headline}
            onChange={(headline) => {
              setPromo({ ...promo, headline });
              touch();
            }}
          />
          <LocalizedField
            label="Message"
            hint="The offer itself, e.g. 10% off all daily rentals. The bar is hidden if this is empty."
            maxLength={160}
            value={promo.message}
            onChange={(message) => {
              setPromo({ ...promo, message });
              touch();
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Discount code"
              hint="Shown on the bar and pre-filled into the booking form. Leave blank for an offer with no code."
            >
              <TextInput
                value={promo.code}
                onChange={(e) => {
                  setPromo({ ...promo, code: e.target.value.toUpperCase() });
                  touch();
                }}
                placeholder="TRAVEL10"
                maxLength={40}
                className="font-mono uppercase"
              />
            </Field>
            <Field label="Button links to" hint="Where the button sends people">
              <TextInput
                value={promo.ctaHref}
                onChange={(e) => {
                  setPromo({ ...promo, ctaHref: e.target.value });
                  touch();
                }}
                placeholder="/book"
              />
            </Field>
          </div>

          <LocalizedField
            label="Button label"
            hint="Leave blank to show no button"
            maxLength={40}
            value={promo.ctaLabel}
            onChange={(ctaLabel) => {
              setPromo({ ...promo, ctaLabel });
              touch();
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" hint="Leave blank to start immediately">
              <TextInput
                type="date"
                value={promo.startDate}
                onChange={(e) => {
                  setPromo({ ...promo, startDate: e.target.value });
                  touch();
                }}
              />
            </Field>
            <Field label="Ends" hint="Runs to the end of this day, then hides itself">
              <TextInput
                type="date"
                value={promo.endDate}
                onChange={(e) => {
                  setPromo({ ...promo, endDate: e.target.value });
                  touch();
                }}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Stats">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Years operating" error={errors["stats.yearsOperating"]}>
            <TextInput type="number" value={stats.yearsOperating} onChange={(e) => { setStats({ ...stats, yearsOperating: e.target.value }); touch(); }} />
          </Field>
          <Field label="Cities covered" error={errors["stats.cities"]}>
            <TextInput type="number" value={stats.cities} onChange={(e) => { setStats({ ...stats, cities: e.target.value }); touch(); }} />
          </Field>
          <Field label="Fleet size" hint="Optional">
            <TextInput type="number" value={stats.fleetSize} onChange={(e) => { setStats({ ...stats, fleetSize: e.target.value }); touch(); }} />
          </Field>
        </div>
      </Section>

      <Section title="Credentials & certificates">
        <div className="space-y-3">
          {credentials.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label">
                  <TextInput value={c.label.en} onChange={(e) => { setCredentials(credentials.map((x, idx) => idx === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)); touch(); }} placeholder="NTN" />
                  <TextInput value={c.label.ur} lang="ur" className="mt-1 font-urdu leading-loose" onChange={(e) => { setCredentials(credentials.map((x, idx) => idx === i ? { ...x, label: { ...x.label, ur: e.target.value } } : x)); touch(); }} placeholder="\u0627\u0631\u062f\u0648 \u062a\u0631\u062c\u0645\u06c1" />
                </Field>
                <Field label="Value">
                  <TextInput value={c.value.en} onChange={(e) => { setCredentials(credentials.map((x, idx) => idx === i ? { ...x, value: { ...x.value, en: e.target.value } } : x)); touch(); }} placeholder="3661268-5" />
                  <TextInput value={c.value.ur} lang="ur" className="mt-1 font-urdu leading-loose" onChange={(e) => { setCredentials(credentials.map((x, idx) => idx === i ? { ...x, value: { ...x.value, ur: e.target.value } } : x)); touch(); }} placeholder="\u0627\u0631\u062f\u0648 \u062a\u0631\u062c\u0645\u06c1" />
                </Field>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="flex-1">
                  <SingleImageField
                    value={c.image ? { ...c.image } : null}
                    onChange={(image) => { setCredentials(credentials.map((x, idx) => idx === i ? { ...x, image } : x)); touch(); }}
                    subfolder="credentials"
                    hint="Optional certificate scan"
                  />
                </div>
                <button type="button" onClick={() => { setCredentials(credentials.filter((_, idx) => idx !== i)); touch(); }} className="mb-1 rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => { setCredentials([...credentials, { label: emptyPair, value: emptyPair, image: null }]); touch(); }}>
            <FiPlus /> Add credential
          </Button>
        </div>
      </Section>

      <Section title="Commercial terms" subtitle="Shown on the Rates page. Markdown supported.">
        <LocalizedField
          label="Commercial terms"
          multiline
          value={commercialTerms}
          onChange={(v) => { setCommercialTerms(v); touch(); }}
          controlClassName="min-h-[160px] text-xs"
        />
      </Section>

      <Section title="About the company" subtitle="Shown on the About page. Markdown supported for story & HSE.">
        <div className="space-y-4">
          <LocalizedField
            label="Our mission"
            multiline
            hint="Leave blank to use the default mission statement."
            value={about.mission}
            onChange={(mission) => { setAbout({ ...about, mission }); touch(); }}
            controlClassName="min-h-[100px]"
          />
          <LocalizedField
            label='Company story ("Why choose Shani Travels")'
            multiline
            value={about.story}
            onChange={(story) => { setAbout({ ...about, story }); touch(); }}
            controlClassName="min-h-[120px]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CEO name">
              <TextInput value={about.ceoName} onChange={(e) => { setAbout({ ...about, ceoName: e.target.value }); touch(); }} />
            </Field>
            <Field label="CEO photograph">
              <SingleImageField
                value={about.ceoImage ?? null}
                onChange={(ceoImage) => { setAbout({ ...about, ceoImage }); touch(); }}
                subfolder="about"
                hint="Floated to the right of the message on the About page, with the text wrapping around it. A square crop works best. Leave empty and the letter runs full width."
              />
            </Field>
          </div>
          <Field label="CEO message">
            <TextArea value={about.ceoMessage.en} onChange={(e) => { setAbout({ ...about, ceoMessage: { ...about.ceoMessage, en: e.target.value } }); touch(); }} />
            <TextArea value={about.ceoMessage.ur} lang="ur" className="mt-1 font-urdu leading-loose" placeholder="\u0627\u0631\u062f\u0648 \u062a\u0631\u062c\u0645\u06c1" onChange={(e) => { setAbout({ ...about, ceoMessage: { ...about.ceoMessage, ur: e.target.value } }); touch(); }} />
          </Field>
          <Field label="HSE summary">
            <TextArea value={about.hseSummary.en} onChange={(e) => { setAbout({ ...about, hseSummary: { ...about.hseSummary, en: e.target.value } }); touch(); }} className="min-h-[120px] text-xs" />
            <TextArea value={about.hseSummary.ur} lang="ur" placeholder="\u0627\u0631\u062f\u0648 \u062a\u0631\u062c\u0645\u06c1" onChange={(e) => { setAbout({ ...about, hseSummary: { ...about.hseSummary, ur: e.target.value } }); touch(); }} className="mt-1 min-h-[120px] font-urdu text-xs leading-loose" />
          </Field>
        </div>
      </Section>

      <Section title="SEO defaults">
        <div className="space-y-4">
          <LocalizedField
            label="Default title"
            required
            error={errors["seoDefaults.title"]}
            value={seo.title}
            onChange={(title) => { setSeo({ ...seo, title }); touch(); }}
          />
          <LocalizedField
            label="Default description"
            required
            error={errors["seoDefaults.description"]}
            multiline
            value={seo.description}
            onChange={(description) => { setSeo({ ...seo, description }); touch(); }}
          />
          <Field label="Default OG image" hint="Used for social sharing where a page has no specific image.">
            <SingleImageField value={seo.ogImage} onChange={(ogImage) => { setSeo({ ...seo, ogImage }); touch(); }} subfolder="og" />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {dirty && <span className="mr-auto text-xs text-amber-600">Unsaved changes</span>}
        <Button onClick={save} pending={pending}>
          <FiSave /> Save settings
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StringList({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const list = values.length ? values : [""];
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="space-y-2">
        {list.map((val, i) => (
          <div key={i} className="flex gap-2">
            <TextInput
              value={val}
              placeholder={placeholder}
              onChange={(e) => onChange(list.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
            <button
              type="button"
              onClick={() => onChange(list.filter((_, idx) => idx !== i))}
              className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
              aria-label="Remove"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...list, ""])}
          className="flex items-center gap-1 text-xs font-medium text-navy hover:underline"
        >
          <FiPlus className="h-3 w-3" /> Add another
        </button>
      </div>
    </div>
  );
}
