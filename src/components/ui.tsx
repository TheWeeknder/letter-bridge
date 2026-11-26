// =============================================================================
// ui.tsx — small building blocks shared by every screen, so headings, buttons,
// cards and inputs look the same everywhere. The look comes from the design
// tokens in globals.css (see DESIGN.md): flat surfaces, pill buttons, square
// letter tiles and small rounded keys.
//
// The type scale (biggest to smallest):
//   hero number    text-7xl     the one thing to look at (letters, final score)
//   ScreenHeader   text-display one per screen, in the slab font: "Game over"
//   SectionHeading text-sm      semibold, sentence case: "High scores · 10s"
//   captions       text-sm      text-muted
// Colour: emerald (accent) for the main action and good news, red (danger)
// only for problems. Token colours switch for dark mode by themselves.
// =============================================================================

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** A screen's title with an optional line of explanation underneath. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h2 className="font-display text-display">{title}</h2>
      {subtitle && <p className="max-w-sm text-base text-muted">{subtitle}</p>}
    </header>
  );
}

/** A heading above a group of things on a screen (a list, a picker…). */
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}

/** The emerald focus ring every clickable thing shares (keyboard users see it). */
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Classes shared by every pill button. */
export const BUTTON_BASE =
  "min-h-12 rounded-full px-6 py-3 font-bold transition-colors duration-150 ease-snap " +
  "disabled:cursor-not-allowed disabled:opacity-40 " +
  FOCUS_RING;

export const BUTTON_VARIANTS = {
  // The main action: solid emerald.
  primary: "bg-accent text-white hover:bg-emerald-600",
  // The other choices: a thin outline, filled lightly on hover.
  secondary: "border border-foreground hover:bg-surface-muted",
} as const;

/**
 * A "key" you pick from a small set (the mode buttons): grey like an
 * on-screen keyboard key, emerald once chosen. Pair with CHOICE_KEY_STATE.
 */
export const CHOICE_KEY =
  "flex h-key items-center justify-center rounded-key text-keycap font-bold tabular-nums " +
  "transition-colors duration-150 ease-snap " +
  FOCUS_RING;

export const CHOICE_KEY_STATE = {
  selected: "bg-accent text-white",
  idle: "bg-key hover:bg-key/70",
} as const;

/**
 * A list in a quiet bordered card, one row per item with a thin line between
 * rows (high scores, players, standings).
 */
export const LIST_CARD = "divide-y divide-line overflow-hidden rounded-card border border-line text-left";

/** A text box: a 2px tile-style border that darkens while you type in it. */
export const INPUT_BASE =
  "min-h-12 w-full min-w-0 rounded-card border-2 bg-transparent px-4 text-center outline-none " +
  "transition-colors duration-150 placeholder:text-muted";

/** The border colours for INPUT_BASE: normal, or red after a wrong try. */
export const INPUT_BORDER = {
  normal: "border-tile-border focus:border-foreground",
  invalid: "border-danger",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
}

/** A standard button. "primary" = the main action, "secondary" = the other choices. */
export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...rest} />;
}

/** A link that looks like a Button (for moving to another page, e.g. "Play solo"). */
export function LinkButton({
  href,
  variant = "primary",
  className = "",
  onClick,
  children,
}: {
  href: string;
  variant?: keyof typeof BUTTON_VARIANTS;
  className?: string;
  onClick?: () => void; // runs before navigating (e.g. leave a room)
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} flex items-center justify-center ${className}`}
    >
      {children}
    </Link>
  );
}

/** A quiet "← Back" link at the bottom of a screen. */
export function BackLink({
  href = "/",
  onClick,
  children = "Back",
}: {
  href?: string;
  onClick?: () => void; // runs before navigating (e.g. leave a room)
  children?: ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
      ← {children}
    </Link>
  );
}
