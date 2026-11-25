// =============================================================================
// apple-icon.tsx — the icon iPhones and iPads use for "Add to Home Screen".
//
// Apple ignores the web manifest's icons and looks for this instead.
// 180x180 is the size Apple asks for. iOS rounds the corners itself, so we
// draw it square (the same as the "maskable" style).
// =============================================================================

import { renderIcon } from "@/lib/iconArt";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon({ size: size.width, maskable: true });
}
