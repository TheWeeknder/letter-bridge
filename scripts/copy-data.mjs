// =============================================================================
// copy-data.mjs — copy the word lists from /data into /public/data.
//
// WHY: Next.js only serves files from /public to the browser. We keep the
// "real" lists in /data (the single source of truth, also read directly by
// tests and scripts) and copy them over automatically before `dev`/`build`
// via the "predev" and "prebuild" npm scripts. /public/data is gitignored so
// the lists are only committed once.
// =============================================================================

import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = "data";
const dest = join("public", "data");

mkdirSync(dest, { recursive: true });

for (const file of readdirSync(src)) {
  if (!file.endsWith(".txt")) continue; // skip SOURCES.md etc.
  copyFileSync(join(src, file), join(dest, file));
  console.log(`copied ${join(src, file)} -> ${join(dest, file)}`);
}
