// =============================================================================
// vitest.config.mts — settings for the unit test runner (Vitest).
//
// The ".mts" extension tells Node "this file uses modern ES module syntax"
// (import/export), which Vitest needs to load it.
// Run tests with `npm test` (goes through scripts/run-tests.mjs; see why there).
// =============================================================================

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Make "@/lib/..." mean "src/lib/...", same as in tsconfig.json,
    // so tests can use the exact same imports as the app.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node", // pure logic only — no browser needed
    passWithNoTests: true,
  },
});
