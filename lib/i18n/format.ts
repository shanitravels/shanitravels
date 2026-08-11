/**
 * Fills `{name}` placeholders in a dictionary string.
 *
 * Shared by server and client, so it lives apart from server.ts (which is
 * server-only). Unknown placeholders are left in place rather than blanked —
 * a visible `{total}` in the UI points at the bug far faster than a gap does.
 */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}
