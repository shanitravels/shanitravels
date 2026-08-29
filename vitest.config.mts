import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for the pure logic in lib/ — pricing, formatting, engine parsing,
 * locale fallback. No database, no DOM, no Next runtime: everything under test
 * is a plain function, which is exactly why these are the cheapest tests in the
 * project and cover the code that decides what a customer is quoted.
 */
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./*" alias in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    // The site quotes in PKR and renders dates for a Pakistani audience;
    // pinning the zone keeps Intl output identical on a laptop and in CI.
    env: { TZ: "Asia/Karachi" },
  },
});
