// =============================================================================
// clean.mjs — delete the .next folder (Next.js / Turbopack build + cache).
// Run with: npm run clean   (stop `npm run dev` first!)
//
// WHY: Turbopack keeps a cache on disk to make restarts fast. If packages in
// node_modules change while it's running (e.g. a reinstall), that cache can
// remember "this package doesn't exist" even after it's back, giving errors
// like "Cannot find module '@tailwindcss/turbopack'". Deleting .next is safe:
// it is rebuilt automatically on the next `npm run dev` or `npm run build`.
// =============================================================================

import { rmSync } from "node:fs";

rmSync(".next", { recursive: true, force: true });
console.log("Deleted .next. Now run: npm run dev");
