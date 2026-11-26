"use client";
// =============================================================================
// OnScreenKeyboard — the game's own keyboard, shown at the bottom of the
// playing screen on phones and tablets.
//
// WHY: on a phone, tapping the answer box opens the phone's keyboard, which
// slides up over half the page and hides the letters and the timer. During a
// game the answer box tells the phone NOT to open it (inputMode="none", see
// AnswerInput) and these keys type into the box instead.
//
//   Q W E R T Y U I O P
//    A S D F G H J K L
//   ENTER Z X C V B N M ⌫
//
// The keys for the current START and END letters get an emerald outline, so
// they're quick to find; it moves with every new pair.
//
// Each key prevents the default "pointerdown" so the answer box keeps focus
// (and keeps showing its cursor) while you tap.
// =============================================================================

import type { KeyboardKey } from "./keyboard";

const ROWS: KeyboardKey[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["ENTER", "z", "x", "c", "v", "b", "n", "m", "BACKSPACE"],
];

export interface OnScreenKeyboardProps {
  onKey: (key: KeyboardKey) => void;
  highlight?: string[]; // letters to outline, e.g. the pair's start and end ("a", "e")
}

/** What a key shows, and what a screen reader says for it. */
function keyFace(key: KeyboardKey): { label: string; name: string } {
  if (key === "ENTER") return { label: "Enter", name: "Enter" };
  if (key === "BACKSPACE") return { label: "⌫", name: "Delete letter" };
  return { label: key.toUpperCase(), name: key.toUpperCase() };
}

export function OnScreenKeyboard({ onKey, highlight = [] }: OnScreenKeyboardProps) {
  const outlined = new Set(highlight.map((letter) => letter.toLowerCase()));

  return (
    <div
      role="group"
      aria-label="Keyboard"
      // Slightly wider than the page column (-mx-4), so the keys are big enough
      // to hit; padded above the iPhone home bar.
      className="-mx-4 flex w-[calc(100%+2rem)] max-w-keyboard flex-col gap-2 pb-[env(safe-area-inset-bottom)] short:gap-1.5 select-none"
    >
      {ROWS.map((row, r) => (
        <div key={r} className="flex justify-center gap-1.5">
          {/* The middle row is indented by half a key on each side, like a real keyboard. */}
          {r === 1 && <span className="flex-[0.5]" aria-hidden />}
          {row.map((key) => {
            const { label, name } = keyFace(key);
            const wide = key === "ENTER" || key === "BACKSPACE";
            return (
              <button
                key={key}
                type="button"
                aria-label={name}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onKey(key)}
                className={
                  "flex h-key items-center justify-center rounded-key bg-key font-bold touch-manipulation " +
                  "transition-transform duration-75 active:scale-95 active:bg-key/70 short:h-11 " +
                  (wide ? "flex-[1.5] text-xs uppercase" : "flex-1 text-lg") +
                  (outlined.has(key) ? " ring-2 ring-accent ring-inset" : "")
                }
              >
                {key === "BACKSPACE" ? <span className="text-xl">{label}</span> : label}
              </button>
            );
          })}
          {r === 1 && <span className="flex-[0.5]" aria-hidden />}
        </div>
      ))}
    </div>
  );
}
