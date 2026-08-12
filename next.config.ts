import type { NextConfig } from "next";

/**
 * Origins allowed to reach the dev server besides the one it was started with.
 *
 * A tunnel (ngrok and friends) puts the browser on a different origin than
 * `next dev` bound to, and Next.js blocks cross-origin requests to dev-only
 * assets and endpoints by default. The symptom is not subtle: every
 * `/_next/static/chunks/*.js` returns 403, the HMR socket never connects, and
 * because nothing hydrates the page renders but no control on it works.
 *
 * The wildcards are here rather than a single hostname because ngrok's free
 * subdomain changes every restart, and pinning one would break this again
 * tomorrow. `DEV_TUNNEL_HOST` covers any other tunnel without another edit.
 */
const devTunnelOrigins = [
  process.env.DEV_TUNNEL_HOST,
  "*.ngrok-free.dev",
  "*.ngrok-free.app",
  "*.ngrok.io",
].filter((host): host is string => Boolean(host));

const nextConfig: NextConfig = {
  images: {
    // All media is delivered through the Cloudinary loader (lib/cloudinary-loader.ts).
    // It injects f_auto,q_auto + width transforms for Cloudinary URLs and passes
    // other sources through untouched.
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
  },

  // Read only by `next dev`; ignored in a production build.
  allowedDevOrigins: devTunnelOrigins,

  // Server Actions compare the request's Origin against the Host and reject a
  // mismatch as CSRF — which is exactly what a tunnel looks like. Without this
  // the language switcher's setLocale() is refused even once the chunks load.
  //
  // Deliberately development-only: this waives a CSRF check, and production is
  // served from its own domain where the default comparison already passes.
  ...(process.env.NODE_ENV === "development"
    ? { experimental: { serverActions: { allowedOrigins: devTunnelOrigins } } }
    : {}),
};

export default nextConfig;
