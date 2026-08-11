import dns from "node:dns";
import dnsPromises from "node:dns/promises";

/**
 * Work around Node failing to read the OS resolver configuration.
 *
 * `mongodb+srv://` URIs need a DNS SRV lookup to discover the Atlas shard
 * hosts. Node resolves those through its bundled c-ares resolver, not through
 * the OS — and on some machines (notably Windows adapters that get their DNS
 * from DHCP rather than a static setting) c-ares fails to enumerate the
 * nameservers and silently falls back to its built-in default of 127.0.0.1.
 * Nothing listens there, so every lookup dies with:
 *
 *     querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
 *
 * which surfaces as "database unreachable" even though the cluster,
 * credentials and IP allow-list are all fine.
 *
 * Note this is NOT fixable by changing the machine's DNS settings. Node uses
 * its bundled c-ares resolver for `resolve*` calls, not the OS resolver, so a
 * host whose `dns.lookup()` works perfectly can still fail every `resolveSrv`.
 * Where c-ares can't read the platform config, the code has to supply it.
 *
 * If — and only if — every resolver Node knows about is a loopback address,
 * point it at working ones instead. On a healthy host this is a no-op.
 *
 * Both `node:dns` and `node:dns/promises` must be set. Plain Node keeps their
 * default resolvers in sync, but under Next's server runtime they can end up
 * as separate instances — `dns.setServers()` at startup then fixes only the
 * callback API, while `dns.getServers()` cheerfully reports the new servers.
 * The MongoDB driver resolves SRV through the promises API, so it kept using
 * the untouched 127.0.0.1 resolver and every lookup died with ECONNREFUSED.
 * That asymmetry is why this checks, and sets, both.
 *
 * `DNS_SERVERS` (comma-separated) overrides the replacements. Setting it also
 * silences the warning: an explicit value means the operator already knows,
 * and the warning exists for the case nobody has noticed yet.
 */

const DEFAULT_SERVERS = ["1.1.1.1", "8.8.8.8"];

/**
 * Parked on globalThis, not a module-scoped `let`: dev hot reloads re-evaluate
 * this module, which would reset a plain flag and re-announce the fallback on
 * every recompile. Same reason lib/db.ts caches its connection there.
 */
const globalWithDns = globalThis as typeof globalThis & { __dnsFallbackWarned?: boolean };

function isLoopback(server: string): boolean {
  // getServers() may append a port ("127.0.0.1:5353") or bracket IPv6.
  const host = server.replace(/^\[|\]$/g, "").replace(/:\d+$/, "");
  return host === "::1" || host.startsWith("127.");
}

function serversOf(resolver: { getServers(): string[] }): string[] {
  try {
    return resolver.getServers();
  } catch {
    return [];
  }
}

/** No servers at all is as broken as a loopback-only list; treat them alike. */
function isBroken(servers: string[]): boolean {
  return servers.length === 0 || servers.every(isLoopback);
}

/**
 * Idempotent — safe to call from every entry point. Deliberately re-checks on
 * each call rather than short-circuiting on a flag: the promises resolver can
 * be created (at 127.0.0.1) *after* an earlier call already fixed the callback
 * one, and a flag would skip precisely the call that would have caught it.
 */
export function applyDnsFallback(): void {
  const current = serversOf(dns);

  if (!isBroken(current) && !isBroken(serversOf(dnsPromises))) return;

  const configured = process.env.DNS_SERVERS?.trim();
  const replacement = (configured || DEFAULT_SERVERS.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (replacement.length === 0) return;

  try {
    dns.setServers(replacement);
    dnsPromises.setServers(replacement);
  } catch (err) {
    console.warn(
      `[dns] could not apply resolver fallback: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return;
  }

  // Deliberately silent when DNS_SERVERS is set: that is a considered choice,
  // not a surprise, and repeating it on every boot only trains people to
  // ignore the log.
  if (configured || globalWithDns.__dnsFallbackWarned) return;
  globalWithDns.__dnsFallbackWarned = true;

  console.warn(
    `[dns] Node's resolver reported ${
      current.length ? current.join(", ") : "no servers"
    } — using ${replacement.join(", ")} instead so mongodb+srv lookups resolve. ` +
      "Set DNS_SERVERS in .env.local to make this explicit and silence this notice."
  );
}
