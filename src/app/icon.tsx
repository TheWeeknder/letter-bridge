// =============================================================================
// icon.tsx — Next.js turns this file into the app's icons (PNG images).
//
// generateImageMetadata() lists every version we want. Next calls the default
// function once per entry and serves each one at /icon/<id>:
//   /icon/192       browser tab + Android home screen
//   /icon/512       big version (install screens, splash screen)
//   /icon/maskable  Android version that can be cropped into any shape
// The manifest (manifest.ts) points phones at these URLs.
// Because nothing here changes per visitor, they're made ONCE at build time.
// =============================================================================

import { ICONS, renderIcon } from "@/lib/iconArt";

export function generateImageMetadata() {
  return ICONS.map(({ id, size }) => ({
    id,
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

// Next.js 16 passes `id` as a Promise, so we `await` it.
export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const icon = ICONS.find((entry) => entry.id === iconId) ?? ICONS[0];
  return renderIcon({ size: icon.size, maskable: icon.maskable });
}
