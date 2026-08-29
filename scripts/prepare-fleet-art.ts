/**
 * Clean the fleet-category cutouts for the homepage catalog.
 *
 *   npm run fleet:art          # write public/fleet/*.png
 *   npm run fleet:art -- --dry # report what would change, write nothing
 *
 * The supplied artwork carries a soft drop shadow rendered into the alpha
 * channel — a band of semi-transparent dark pixels under each car. On the
 * homepage tile that reads as a grey smudge sitting on the wash, so it is
 * stripped here rather than in CSS, where it cannot be reached at all.
 *
 * Two passes, then a crop:
 *
 *   1. Per column, find the lowest fully-opaque pixel — the bottom of the
 *      bodywork. Anything below it that is both translucent and dark is
 *      ground shadow, never car, so its alpha goes to zero. A two-pixel
 *      grace band keeps the anti-aliased edge of the tyre.
 *   2. A column with no opaque pixel at all sits entirely outside the car,
 *      so the same test clears its whole height — this is what removes the
 *      shadow that pools out beyond the wheels.
 *   3. Crop to what survives. The car then fills its tile instead of floating
 *      in the empty space the shadow used to occupy, which is most of why it
 *      looked small.
 *
 * Originals in public/ are never modified: output goes to public/fleet/, so a
 * bad result is undone by pointing the component back at the originals.
 *
 * No image library — Node's zlib is enough for 8-bit RGBA PNGs, and adding a
 * dependency for seven files is not worth it. Anything else is reported and
 * skipped rather than silently mangled.
 */

import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SOURCE_DIR = "public";
const OUT_DIR = join("public", "fleet");

/** The seven class cutouts, by their supplied filenames. */
const FILES = [
  "Economy.png",
  "Sedan.png",
  "SUV.png",
  "Event Transport.png",
  "Executive.png",
  "Specialized.png",
  "Logistics.png",
];

/** Below this mean RGB a translucent pixel is shadow rather than paintwork. */
const SHADOW_LUMA = 150;
/** Rows of anti-aliased tyre edge kept below the last solid pixel. */
const EDGE_GRACE = 2;
/** Alpha at or below this counts as empty when finding the crop box. */
const EMPTY_ALPHA = 8;

interface Bitmap {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row-major. */
  data: Buffer;
}

// ---------------------------------------------------------------------------
// PNG decode / encode — 8-bit RGBA only
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function decodePng(file: string): Bitmap {
  const buf = readFileSync(file);
  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat: Buffer[] = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    if (type === "IHDR") {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      depth = buf[pos + 16];
      colorType = buf[pos + 17];
      interlace = buf[pos + 20];
    } else if (type === "IDAT") {
      idat.push(buf.subarray(pos + 8, pos + 8 + length));
    }
    pos += 12 + length;
  }

  if (depth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `unsupported PNG (bit depth ${depth}, colour type ${colorType}, interlace ${interlace}); expected 8-bit RGBA, non-interlaced`
    );
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  // Undo the per-scanline filters (PNG spec §9).
  let o = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[o++];
    const line = raw.subarray(o, o + stride);
    o += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prior[x];
      const c = x >= bpp ? prior[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  return { width, height, data: out };
}

function chunk(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encodePng({ width, height, data }: Bitmap): Buffer {
  const stride = width * 4;
  // Filter type 0 (none) on every row: these are small, and the deflate pass
  // does the real work.
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------

/** Zero the alpha of every ground-shadow pixel. Returns how many it cleared. */
function stripShadow(bmp: Bitmap): number {
  const { width, height, data } = bmp;
  const stride = width * 4;
  let cleared = 0;

  for (let x = 0; x < width; x++) {
    let lastOpaque = -1;
    for (let y = 0; y < height; y++) {
      if (data[y * stride + x * 4 + 3] === 255) lastOpaque = y;
    }
    // No solid pixel anywhere in this column → the whole column is outside the
    // bodywork, so every translucent dark pixel in it is shadow.
    const from = lastOpaque === -1 ? 0 : lastOpaque + 1 + EDGE_GRACE;
    for (let y = from; y < height; y++) {
      const i = y * stride + x * 4;
      const alpha = data[i + 3];
      if (alpha === 0 || alpha === 255) continue;
      const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (luma < SHADOW_LUMA) {
        data[i + 3] = 0;
        cleared++;
      }
    }
  }
  return cleared;
}

/** Tightest box containing everything still visible. */
function cropToContent(bmp: Bitmap): Bitmap {
  const { width, height, data } = bmp;
  const stride = width * 4;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * stride + x * 4 + 3] > EMPTY_ALPHA) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0) throw new Error("image is fully transparent after shadow removal");

  const w = right - left + 1;
  const h = bottom - top + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    data.copy(out, y * w * 4, (top + y) * stride + left * 4, (top + y) * stride + (left + w) * 4);
  }
  return { width: w, height: h, data: out };
}

function main(): void {
  const dry = process.argv.includes("--dry");
  if (!dry && !existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let failures = 0;
  for (const name of FILES) {
    const source = join(SOURCE_DIR, name);
    if (!existsSync(source)) {
      console.error(`  MISSING  ${name}`);
      failures++;
      continue;
    }
    try {
      const bmp = decodePng(source);
      const before = `${bmp.width}x${bmp.height}`;
      const cleared = stripShadow(bmp);
      const cropped = cropToContent(bmp);
      const after = `${cropped.width}x${cropped.height}`;
      if (!dry) writeFileSync(join(OUT_DIR, name), encodePng(cropped));
      console.log(
        `  ${dry ? "would fix" : "wrote   "} ${name.padEnd(22)} ${before.padStart(9)} -> ${after.padEnd(9)} ` +
          `${String(cleared).padStart(6)} shadow px cleared`
      );
    } catch (err) {
      console.error(`  FAILED   ${name}: ${err instanceof Error ? err.message : String(err)}`);
      failures++;
    }
  }

  if (failures) {
    console.error(`\n${failures} file(s) failed. Originals in public/ are untouched.`);
    process.exit(1);
  }
  console.log(`\n${dry ? "Dry run — nothing written." : `Wrote ${FILES.length} file(s) to ${OUT_DIR}/`}`);
}

main();
