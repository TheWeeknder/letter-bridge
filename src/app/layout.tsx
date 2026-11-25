// =============================================================================
// layout.tsx — the HTML "frame" around every page: fonts, <html>, <body>.
//
// FONT CHOICE: the game shows the START letter in uppercase and the END letter
// in lowercase, so an uppercase "I" and a lowercase "l" can appear side by
// side. In many fonts (Arial, Geist…) both are just a plain vertical bar.
// Atkinson Hyperlegible Next was designed by the Braille Institute so that
// look-alike characters (I / l / 1, O / 0) are always distinct: its "I" has
// serifs (bars top and bottom) and its "l" has a curved tail.
// =============================================================================

import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font downloads the font at build time and serves it from our own site,
// so there's no request to Google when players load the game.
// `variable` exposes it as a CSS variable that globals.css plugs into Tailwind.
const hyperlegible = Atkinson_Hyperlegible_Next({
  variable: "--font-hyperlegible",
  subsets: ["latin"],
});

// Monospace font, used for the debug panel (every character the same width).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Generate a Word!",
  description: "Type a word that starts and ends with the given letters before time runs out.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${hyperlegible.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
