// =============================================================================
// ui.tsx — small building blocks shared by every screen, so headings, buttons
// and spacing look the same everywhere.
//
// The type scale (biggest to smallest):
//   hero number   text-7xl   the one thing to look at (letters, final streak)
//   ScreenHeader  text-2xl   one per screen: "How to play", "Game over"
//   SectionHeading text-sm   semibold, sentence case: "High scores · 10s"
//   captions      text-sm    muted grey
// Colour: emerald for the main action and good news, red only for problems.
// =============================================================================

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** A screen's title with an optional line of explanation underneath. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && <p className="max-w-sm text-base text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </header>
  );
}

/** A heading above a group of things on a screen (a list, a picker…). */
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{children}</h3>;
}

/** Classes shared by every button shape (also used by the time-limit picker). */
export const BUTTON_BASE =
  "min-h-12 rounded-xl px-5 py-3 font-bold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500";

export const BUTTON_VARIANTS = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600",
  secondary: "border-2 border-zinc-300 hover:border-emerald-500 dark:border-zinc-700",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
}

/** A standard button. "primary" = the main action, "secondary" = the other choices. */
export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...rest} />;
}
