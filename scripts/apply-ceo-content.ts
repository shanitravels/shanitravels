/**
 * Apply the CEO-supplied About and Safety copy (November 2026 handover).
 *
 *   npx tsx scripts/apply-ceo-content.ts --dry
 *   npx tsx scripts/apply-ceo-content.ts
 *
 * Writes three things:
 *   1. Settings -> about.mission     — the mission statement + seven commitments
 *   2. Settings -> about.ceoMessage  — the CEO's letter (markdown, 6 paragraphs)
 *   3. SafetySection "safety-policy" — the 12-point policy, rendered as the
 *      lead statement on /safety rather than as another protocol card
 *
 * `about.hseSummary` is left alone except for a link through to /safety, which
 * is appended only when it isn't already there — that field is hand-edited in
 * the admin panel and should not be clobbered by a rerun.
 *
 * Idempotent: rerunning writes the same values. Pass --dry to print a diff
 * summary without touching the database.
 *
 * NOTE: writing straight to the database bypasses Next's cache invalidation.
 * After running, purge with `POST /api/revalidate?tag=settings` and
 * `?tag=safety` (or clear .next/cache locally).
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import mongoose from "mongoose";
import { SettingsModel, SafetySectionModel } from "../lib/models";
import { applyDnsFallback } from "../lib/dns-fallback";

const POLICY_SLUG = "safety-policy";

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const MISSION_EN = `At Shani Travels, our mission is to deliver safe, reliable, professional, and customer-focused transportation solutions that create lasting value for our clients and communities.

With more than 30 years of industry experience, we are committed to combining our nationwide operational strength, comprehensive fleet, experienced people, and modern service standards to provide seamless mobility across Pakistan.

## We strive to

- **Exceed client expectations** through consistent service excellence and personalized solutions.
- **Prioritize safety, reliability, and comfort** in every journey and assignment.
- **Maintain the highest standards** of professionalism, integrity, and accountability.
- **Continuously improve** our fleet, technology, systems, and human resources.
- **Build long-term partnerships** based on trust, transparency, and mutual respect.
- **Empower our people** through training, teamwork, leadership, and professional growth.
- **Support institutional clients** — national and international organizations, corporate clients, diplomatic missions and development agencies — with dedication and efficiency.

Our commitment is simple: to move people safely, serve every client with respect, and deliver excellence in every journey.`;

const MISSION_UR = `شانی ٹریولز کا مشن یہ ہے کہ ہم محفوظ، قابلِ اعتماد، پیشہ ورانہ اور گاہک پر مرکوز ٹرانسپورٹ حل فراہم کریں جو ہمارے کلائنٹس اور معاشرے کے لیے دیرپا قدر پیدا کریں۔

تیس سال سے زائد کے تجربے کے ساتھ ہم اپنی ملک گیر آپریشنل صلاحیت، وسیع فلیٹ، تجربہ کار افرادی قوت اور جدید معیارِ خدمت کو یکجا کر کے پورے پاکستان میں بلا رکاوٹ نقل و حرکت فراہم کرنے کے لیے پُرعزم ہیں۔

## ہماری کوشش

- **کلائنٹ کی توقعات سے بڑھ کر** مسلسل بہترین خدمت اور ضرورت کے مطابق حل فراہم کرنا۔
- **حفاظت، اعتماد اور آرام کو ترجیح دینا** — ہر سفر اور ہر ذمہ داری میں۔
- **اعلیٰ ترین معیار برقرار رکھنا** پیشہ ورانہ رویے، دیانت اور جوابدہی کا۔
- **مسلسل بہتری لانا** اپنے فلیٹ، ٹیکنالوجی، نظام اور افرادی قوت میں۔
- **دیرپا شراکت داری قائم کرنا** جو اعتماد، شفافیت اور باہمی احترام پر مبنی ہو۔
- **اپنے لوگوں کو بااختیار بنانا** تربیت، ٹیم ورک، قیادت اور پیشہ ورانہ ترقی کے ذریعے۔
- **اداروں کی معاونت کرنا** — قومی و بین الاقوامی تنظیمیں، کارپوریٹ کلائنٹس، سفارتی مشن اور ترقیاتی ادارے — لگن اور مستعدی کے ساتھ۔

ہمارا عہد سادہ ہے: لوگوں کو محفوظ طریقے سے منتقل کرنا، ہر کلائنٹ کی عزت کرنا، اور ہر سفر میں بہترین کارکردگی دکھانا۔`;

// "partnerdelivering" in the source copy was a missing space; corrected here.
const CEO_EN = `It is my privilege to introduce Shani Travels as a trusted and established leader in Car Rental, Fleet Management, and Ground Transportation Solutions in Pakistan, backed by more than 30 years of industry experience and a strong nationwide operational presence.

Our comprehensive fleet and professional infrastructure enable us to provide reliable, safe, efficient, and customized transportation solutions for corporate organizations, multinational companies, UN and development agencies, government institutions, diplomatic missions, and other national and international clients.

At Shani Travels, our philosophy is simple: understand our clients' requirements, deliver with precision, and exceed expectations. We are committed to the highest standards of professionalism, safety, service quality, punctuality, integrity, and customer satisfaction.

Our greatest strength is the trust of our clients and the dedication of our people. Through continuous investment in our fleet, technology, systems, and human resources, we remain focused on delivering world-class transportation services with a distinctly Pakistani commitment to hospitality and care.

I sincerely appreciate the confidence and continued support of our valued clients, partners, and team members. Their trust motivates us to pursue higher standards and stronger partnerships.

Our vision is to remain a preferred transportation partner — delivering mobility with reliability, professionalism with purpose, and service with excellence.`;

const CEO_UR = `یہ میرے لیے اعزاز کی بات ہے کہ میں شانی ٹریولز کو پاکستان میں کار رینٹل، فلیٹ مینجمنٹ اور گراؤنڈ ٹرانسپورٹیشن کے شعبے میں ایک قابلِ اعتماد اور مستحکم ادارے کے طور پر متعارف کراؤں — جسے تیس سال سے زائد کا تجربہ اور ملک گیر آپریشنل موجودگی حاصل ہے۔

ہمارا وسیع فلیٹ اور پیشہ ورانہ انفراسٹرکچر ہمیں اس قابل بناتا ہے کہ ہم کارپوریٹ اداروں، ملٹی نیشنل کمپنیوں، اقوامِ متحدہ اور ترقیاتی اداروں، سرکاری محکموں، سفارتی مشنوں اور دیگر قومی و بین الاقوامی کلائنٹس کو قابلِ اعتماد، محفوظ، مؤثر اور ان کی ضروریات کے مطابق ٹرانسپورٹ حل فراہم کریں۔

شانی ٹریولز میں ہمارا فلسفہ سادہ ہے: کلائنٹ کی ضرورت کو سمجھیں، اسے درستگی کے ساتھ پورا کریں، اور توقعات سے بڑھ کر کارکردگی دکھائیں۔ ہم پیشہ ورانہ رویے، حفاظت، معیارِ خدمت، وقت کی پابندی، دیانت اور گاہک کے اطمینان کے بلند ترین معیارات کے لیے پُرعزم ہیں۔

ہماری سب سے بڑی طاقت ہمارے کلائنٹس کا اعتماد اور ہمارے لوگوں کی لگن ہے۔ اپنے فلیٹ، ٹیکنالوجی، نظام اور افرادی قوت میں مسلسل سرمایہ کاری کے ذریعے ہم عالمی معیار کی ٹرانسپورٹ خدمات فراہم کرنے پر مرکوز ہیں — ایک نمایاں پاکستانی مہمان نوازی اور خیال داری کے ساتھ۔

میں اپنے معزز کلائنٹس، شراکت داروں اور ٹیم کے اراکین کے اعتماد اور مسلسل تعاون کا دل سے شکر گزار ہوں۔ ان کا اعتماد ہمیں بلند معیارات اور مضبوط شراکت داریوں کی جانب گامزن رکھتا ہے۔

ہمارا وژن یہ ہے کہ ہم ایک ترجیحی ٹرانسپورٹ پارٹنر رہیں — اعتماد کے ساتھ نقل و حرکت، مقصد کے ساتھ پیشہ ورانہ رویہ، اور عمدگی کے ساتھ خدمت۔`;

const CEO_NAME = "Muhammad Khurshid";

const POLICY_TITLE = { en: "Our Safety Policy", ur: "ہماری حفاظتی پالیسی" };

const POLICY_INTRO = {
  en: "At Shani Travels, safety is our highest priority and an integral part of every journey, operation, and service we provide. With more than 30 years of transportation experience, we are committed to maintaining the highest standards of passenger safety, vehicle reliability, driver professionalism, and operational risk management.",
  ur: "شانی ٹریولز میں حفاظت ہماری اولین ترجیح ہے اور ہر سفر، ہر آپریشن اور ہر خدمت کا لازمی حصہ ہے۔ ٹرانسپورٹ کے تیس سال سے زائد تجربے کے ساتھ ہم مسافروں کی حفاظت، گاڑیوں کی قابلِ اعتماد حالت، ڈرائیوروں کے پیشہ ورانہ معیار اور آپریشنل خطرات کے انتظام کے بلند ترین معیارات برقرار رکھنے کے لیے پُرعزم ہیں۔",
};

/**
 * "Label: detail" — the safety page splits on that first colon to bold the
 * label, so keep the label short and never introduce a second early colon.
 */
const POLICY_ITEMS: { en: string; ur: string }[] = [
  {
    en: "Passenger Safety First: The safety, security, comfort, and well-being of our passengers remain our foremost responsibility.",
    ur: "مسافر کی حفاظت سب سے پہلے: ہمارے مسافروں کی حفاظت، سلامتی، آرام اور خیریت ہماری اولین ذمہ داری ہے۔",
  },
  {
    en: "Professional & Trained Drivers: Drivers are carefully selected, licensed, trained, briefed, and regularly evaluated for safe and responsible driving.",
    ur: "پیشہ ور اور تربیت یافتہ ڈرائیور: ڈرائیوروں کا انتخاب احتیاط سے کیا جاتا ہے اور انہیں لائسنس یافتہ، تربیت یافتہ، بریف شدہ اور باقاعدگی سے جانچا جاتا ہے۔",
  },
  {
    en: "Fleet Safety & Maintenance: All vehicles are subject to scheduled preventive maintenance, regular inspections, safety checks, and timely repairs.",
    ur: "فلیٹ کی حفاظت اور دیکھ بھال: تمام گاڑیاں طے شدہ حفاظتی دیکھ بھال، باقاعدہ معائنے، سیفٹی چیکس اور بروقت مرمت سے گزرتی ہیں۔",
  },
  {
    en: "Vehicle Fitness & Compliance: Vehicles are maintained in accordance with applicable legal, regulatory, insurance, and operational requirements.",
    ur: "گاڑی کی اہلیت اور تعمیل: گاڑیوں کو قابلِ اطلاق قانونی، ریگولیٹری، انشورنس اور آپریشنل تقاضوں کے مطابق برقرار رکھا جاتا ہے۔",
  },
  {
    en: "Defensive Driving: Drivers are required to follow defensive-driving principles, speed limits, traffic regulations, and safe-driving practices at all times.",
    ur: "دفاعی ڈرائیونگ: ڈرائیوروں کے لیے دفاعی ڈرائیونگ کے اصولوں، رفتار کی حدود، ٹریفک قوانین اور محفوظ ڈرائیونگ پر ہر وقت عمل لازم ہے۔",
  },
  {
    en: "Fatigue Management: Appropriate measures are taken to manage driver working hours, rest periods, and fatigue-related risks.",
    ur: "تھکن کا انتظام: ڈرائیوروں کے اوقاتِ کار، آرام کے وقفوں اور تھکن سے جڑے خطرات کے انتظام کے لیے مناسب اقدامات کیے جاتے ہیں۔",
  },
  {
    en: "Journey Risk Assessment: Routes and assignments are assessed according to operational, traffic, weather, geographical, and security conditions where required.",
    ur: "سفر کے خطرات کا جائزہ: راستوں اور ذمہ داریوں کا جائزہ ضرورت کے مطابق آپریشنل، ٹریفک، موسمی، جغرافیائی اور سیکیورٹی حالات کی روشنی میں لیا جاتا ہے۔",
  },
  {
    en: "Emergency Preparedness: Appropriate procedures are maintained for accidents, vehicle breakdowns, medical emergencies, security incidents, and other unforeseen situations.",
    ur: "ہنگامی تیاری: حادثات، گاڑی کی خرابی، طبی ہنگامی صورتحال، سیکیورٹی واقعات اور دیگر غیر متوقع حالات کے لیے مناسب طریقہ کار موجود ہیں۔",
  },
  {
    en: "24/7 Operational Support: Our operations and management teams remain available to coordinate and respond to operational and safety requirements.",
    ur: "چوبیس گھنٹے آپریشنل معاونت: ہماری آپریشنز اور انتظامی ٹیمیں آپریشنل و حفاظتی ضروریات پر رابطے اور ردعمل کے لیے ہمہ وقت دستیاب رہتی ہیں۔",
  },
  {
    en: "Incident Reporting: Safety incidents, accidents, complaints, and near-misses are documented, reviewed, and addressed through corrective and preventive measures.",
    ur: "واقعات کی رپورٹنگ: حفاظتی واقعات، حادثات، شکایات اور قریب قریب پیش آنے والے واقعات کو دستاویزی شکل دی جاتی ہے، ان کا جائزہ لیا جاتا ہے اور اصلاحی و احتیاطی اقدامات کیے جاتے ہیں۔",
  },
  {
    en: "Passenger & Client Requirements: We work closely with clients to understand and comply with their specific safety, security, and operational protocols.",
    ur: "مسافر اور کلائنٹ کے تقاضے: ہم کلائنٹس کے ساتھ مل کر ان کے مخصوص حفاظتی، سیکیورٹی اور آپریشنل پروٹوکولز کو سمجھتے اور ان پر عمل کرتے ہیں۔",
  },
  {
    en: "Continuous Improvement: We regularly review our safety procedures, driver performance, fleet condition, and operational practices to continuously improve our safety standards.",
    ur: "مسلسل بہتری: ہم اپنے حفاظتی طریقہ کار، ڈرائیوروں کی کارکردگی، فلیٹ کی حالت اور آپریشنل عمل کا باقاعدہ جائزہ لے کر اپنے حفاظتی معیارات کو مسلسل بہتر بناتے ہیں۔",
  },
];

const HSE_LINK = {
  en: "\n\nOur full safety policy and operating protocols are published at [Safety & Security Protocol](/safety).",
  ur: "\n\nہماری مکمل حفاظتی پالیسی اور آپریٹنگ پروٹوکولز [حفاظت و سلامتی پروٹوکول](/safety) پر شائع کیے گئے ہیں۔",
};

// ---------------------------------------------------------------------------

/**
 * The safety page bolds everything before the first colon, but only when that
 * colon lands within the first 40 characters. Catch a bad line here rather
 * than shipping one that renders as an unbolded run-on.
 */
function assertSplittable(): void {
  for (const item of POLICY_ITEMS) {
    for (const [locale, text] of Object.entries(item)) {
      const at = text.indexOf(":");
      if (at === -1 || at > 40) {
        throw new Error(
          `Policy item has no label-colon within 40 chars (${locale}): ${text.slice(0, 60)}…`
        );
      }
    }
  }
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const dry = process.argv.includes("--dry");
  assertSplittable();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  // Same reason lib/db.ts calls this: Node's bundled resolver can default to
  // 127.0.0.1, and the mongodb+srv lookup then dies before reaching Atlas.
  applyDnsFallback();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✓ Connected. Database: ${mongoose.connection.name}${dry ? "  (dry run)" : ""}\n`);

  // --- Settings -----------------------------------------------------------
  const settings = await SettingsModel.findOne({ singleton: "main" });
  if (!settings) throw new Error('No site settings document (singleton: "main"). Run scripts/seed.ts first.');

  const about = settings.about ?? {};
  const hse = about.hseSummary ?? { en: "", ur: "" };
  // Append the cross-link once. Reruns and later hand-edits both stay safe.
  const nextHse = {
    en: hse.en?.includes("(/safety)") ? hse.en : `${hse.en ?? ""}${HSE_LINK.en}`.trim(),
    ur: hse.ur?.includes("(/safety)") ? hse.ur : `${hse.ur ?? ""}${HSE_LINK.ur}`.trim(),
  };

  console.log("Settings → about");
  console.log(`  mission     ${words(about.mission?.en ?? "")} → ${words(MISSION_EN)} words (en), ${words(MISSION_UR)} (ur)`);
  console.log(`  ceoMessage  ${words(about.ceoMessage?.en ?? "")} → ${words(CEO_EN)} words (en), ${words(CEO_UR)} (ur)`);
  console.log(`  ceoName     ${about.ceoName || "(unset)"} → ${CEO_NAME}`);
  console.log(`  hseSummary  ${hse.en?.includes("(/safety)") ? "already links to /safety" : "appending /safety link"}`);

  if (!dry) {
    settings.about = {
      ...about,
      mission: { en: MISSION_EN, ur: MISSION_UR },
      ceoMessage: { en: CEO_EN, ur: CEO_UR },
      ceoName: CEO_NAME,
      hseSummary: nextHse,
    };
    settings.markModified("about");
    await settings.save();
  }

  // --- Safety policy section ---------------------------------------------
  const existing = await SafetySectionModel.findOne({ slug: POLICY_SLUG });
  console.log(`\nSafetySection "${POLICY_SLUG}"  ${existing ? "update" : "create"}`);
  console.log(`  title  ${POLICY_TITLE.en}`);
  console.log(`  items  ${POLICY_ITEMS.length}`);

  if (!dry) {
    await SafetySectionModel.updateOne(
      { slug: POLICY_SLUG },
      {
        $set: {
          slug: POLICY_SLUG,
          category: "general",
          title: POLICY_TITLE,
          intro: POLICY_INTRO,
          items: POLICY_ITEMS,
          // Negative so it still leads its group if the reserved-slug handling
          // in app/(public)/safety/page.tsx is ever removed.
          order: -1,
          active: true,
        },
      },
      { upsert: true }
    );
  }

  await mongoose.disconnect();

  if (dry) {
    console.log("\nDry run — nothing written.");
  } else {
    console.log("\n✓ Written.");
    console.log("  Purge the cache: POST /api/revalidate?tag=settings and ?tag=safety");
  }
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
