// =============================================================================
// manifest.ts — the "web app manifest": a small JSON file that tells phones
// how to install the game like an app. Next.js serves it at
// /manifest.webmanifest and links it from every page automatically.
//
// The important fields:
//   name / short_name  the label under the home-screen icon
//   display            "standalone" = open WITHOUT the browser's address bar,
//                      so it looks and feels like a real app
//   start_url          the page that opens when you tap the icon
//   icons              the images from icon.tsx
// =============================================================================

import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, BACKGROUND_LIGHT } from "@/lib/brand";
import { ICONS } from "@/lib/iconArt";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME, // "Weld" easily fits under a home screen icon
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    orientation: "portrait", // the game is designed for an upright phone
    background_color: BACKGROUND_LIGHT, // splash screen colour while it opens
    theme_color: BACKGROUND_LIGHT, // colour of the phone's status bar
    icons: ICONS.map(({ id, size, maskable }) => ({
      src: `/icon/${id}`,
      sizes: `${size}x${size}`,
      type: "image/png",
      // "any" = use as-is; "maskable" = the phone may crop it into a shape.
      purpose: maskable ? "maskable" : "any",
    })),
  };
}
