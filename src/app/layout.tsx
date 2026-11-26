// =============================================================================
// layout.tsx — the HTML "frame" around every page: fonts, <html>, <body>.
//
// FONT CHOICE: the game shows the START letter in uppercase and the END letter
// in lowercase, so an uppercase "I" and a lowercase "l" can appear side by
// side. In many fonts (Arial, Geist…) both are just a plain vertical bar.
// Atkinson Hyperlegible Next was designed by the Braille Institute so that
// look-alike characters (I / l / 1, O / 0) are always distinct: its "I" has
// serifs (bars top and bottom) and its "l" has a curved tail.
// Big headings can use Zilla Slab (`font-display`) instead; see DESIGN.md.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Zilla_Slab } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME, BACKGROUND_DARK, BACKGROUND_LIGHT } from "@/lib/brand";
import "./globals.css";

// next/font downloads the font at build time and serves it from our own site,
// so there's no request to Google when players load the game.
// `variable` exposes it as a CSS variable that globals.css plugs into Tailwind.
const hyperlegible = Atkinson_Hyperlegible_Next({
  variable: "--font-hyperlegible",
  subsets: ["latin"],
});

// A chunky slab serif for big headings only (Tailwind class `font-display`,
// see DESIGN.md). Body text and game letters stay in Atkinson.
const zillaSlab = Zilla_Slab({
  variable: "--font-zilla-slab",
  subsets: ["latin"],
  weight: "700",
});

// Text for the browser tab, search results and link previews.
export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // iPhones: when opened from the home screen, show the game full-screen
  // (no Safari bars), with this name under the icon.
  appleWebApp: { capable: true, title: APP_NAME },
};

// How the page fits the phone screen.
// themeColor tints the phone's status bar / browser bar to match the page,
// with a separate colour when the phone is in dark mode.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BACKGROUND_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: BACKGROUND_DARK },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hyperlegible.variable} ${zillaSlab.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
