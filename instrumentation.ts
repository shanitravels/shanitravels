/**
 * Runs once when a Next.js server instance starts, before it serves requests.
 */
export async function register(): Promise<void> {
  // dns/setServers is Node-only; the Edge runtime has no resolver to fix.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { applyDnsFallback } = await import("./lib/dns-fallback");
  applyDnsFallback();
}
