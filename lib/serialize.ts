import { Types } from "mongoose";

/**
 * Convert a lean Mongoose document (or array of them) into a plain
 * JSON-serializable object: ObjectId → string, Date → ISO string, and
 * `_id` renamed to `id`. Required because values crossing `use cache` and
 * server→client boundaries must be serializable.
 */
export function serialize<T>(input: unknown): T {
  return deepConvert(input) as T;
}

function deepConvert(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(deepConvert);
  if (typeof value === "object") {
    // Buffers (e.g. ObjectId internals) shouldn't appear in lean docs, but guard anyway.
    if (typeof (value as { toHexString?: unknown }).toHexString === "function") {
      return (value as { toHexString: () => string }).toHexString();
    }
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__v") continue;
      if (key === "_id") {
        out.id = deepConvert(val);
        continue;
      }
      out[key] = deepConvert(val);
    }
    return out;
  }
  return value;
}
