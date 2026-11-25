// =============================================================================
// iconArt.tsx — draws the app icon: white "A…e" on a green square, the same
// "start letter … end letter" idea players see in the game.
//
// WHY code instead of a .png file: Next.js turns this JSX into PNG images at
// build time (see app/icon.tsx). Changing the colour or letters is a code
// edit, with no image editor needed, and every size is drawn from one design.
//
// NOTE: this JSX is NOT normal React. It's drawn by Next's ImageResponse,
// which only understands inline `style` (no Tailwind classes) and flexbox
// layout. Every element with children needs `display: "flex"`.
// =============================================================================

import { ImageResponse } from "next/og";
import { BRAND_COLOR } from "./brand";

/**
 * Every icon version the app ships. icon.tsx draws them and manifest.ts lists
 * them, both from THIS list, so the two can never disagree.
 */
export const ICONS = [
  { id: "192", size: 192, maskable: false },
  { id: "512", size: 512, maskable: false },
  { id: "maskable", size: 512, maskable: true },
] as const;

export interface IconArtOptions {
  size: number; // width and height in pixels (icons are square)
  /**
   * Maskable icons: Android may crop the icon into a circle, squircle, etc.
   * Only the middle ~80% is guaranteed to stay visible, so a maskable icon
   * has a full-bleed background (no rounded corners: the phone rounds it)
   * and smaller letters that stay inside that safe middle area.
   */
  maskable?: boolean;
}

/** Render the icon at the given size as a PNG response. */
export function renderIcon({ size, maskable = false }: IconArtOptions): ImageResponse {
  // Letters fill less of the icon when maskable, so they're never cropped.
  const fontSize = size * (maskable ? 0.3 : 0.4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLOR,
          // Rounded corners for normal icons; maskable ones stay square.
          borderRadius: maskable ? 0 : size * 0.22,
          color: "white",
          fontSize,
          fontWeight: 700,
          // Tighten the spacing so "A…e" reads as one unit.
          letterSpacing: -fontSize * 0.04,
        }}
      >
        A…e
      </div>
    ),
    // ImageResponse would otherwise default to 1200x630 (a social preview
    // size), so we always pass the real icon size.
    { width: size, height: size },
  );
}
