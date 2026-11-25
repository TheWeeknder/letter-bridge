// =============================================================================
// run-tests.mjs — starts Vitest. `npm test` and `npm run test:watch` use this.
//
// WHY this exists (Windows only): if the terminal's folder has a lowercase
// drive letter, e.g. "c:\JP\..." (VS Code often does this), Vitest ends up
// loading itself twice ("c:" and "C:" look like different folders to it), and
// every test crashes with:
//   TypeError: Cannot read properties of undefined (reading 'config')
// This script simply starts Vitest from the same folder spelled "C:\JP\...".
// On Mac/Linux it changes nothing.
// =============================================================================

import { spawnSync } from "node:child_process";

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());

// Pass along any extra arguments, e.g. `npm test -- validator` or `watch`.
const args = process.argv.slice(2);

const result = spawnSync("npx", ["vitest", ...args], {
  cwd,
  stdio: "inherit", // show Vitest's output directly in this terminal
  shell: true, // needed on Windows to find "npx"
});

process.exit(result.status ?? 1);
