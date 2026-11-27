# DESIGN.md

The visual design spec for Weld: colours, type, spacing, corners, shadows, buttons, cards, layout and motion.

**Why this file exists:** so every screen is built from the same small set of values. The values are defined once, as Tailwind theme tokens in [`src/app/globals.css`](src/app/globals.css). This file explains what each token is for. When you build a screen, use the theme classes (`bg-ink`, `rounded-card`, `text-tile`…), not raw hex codes or one-off pixel sizes.

The file has two parts:
1. **Reference observations**: what was measured from the screenshots in `design-ref/`.
2. **Weld spec**: the tokens we actually use, and the Tailwind class for each.

---

## 1. Reference observations

**Sources:** three screenshots in `design-ref/`:
- `homepage.png`: the light splash screen
- `how-to-play.png`: the dark dialog
- `game.png`: the dark board and keyboard

**How the values were measured:**
- Colours were sampled from the pixels, so they are exact for the screenshots.
- Sizes were measured at 1× (one image pixel = one CSS pixel).
- Motion can't be measured from still images, so motion values are approximate.

### What we take, and what we don't
**We take the design language:**
- flat neutral surfaces
- pill-shaped buttons
- square letter tiles
- small rounded keys
- a heavy display heading over a plain sans body
- one centred column
- quick, crisp motion

**We don't copy the reference game's own identity:**
- its green/yellow tile colours
- its fonts (licensed and proprietary)
- its logo

Weld keeps:
- **emerald** as its single accent colour
- **Atkinson Hyperlegible** as its body font, because the start letter is shown in uppercase and the end letter in lowercase, so `I` and `l` must never look alike

### Colours (sampled)
| Where | Light | Dark |
|---|---|---|
| Page background | `#ffffff` (splash: `#e3e3e1`) | `#121213` |
| Backdrop behind a dialog | n/a | `#090909` |
| Text | `#000000` / `#121212` | `#f8f8f8` |
| Strong pill button fill | `#121212` | n/a |
| Outline pill border | `#000000`, 1px | n/a |
| Empty tile border | n/a | `#3a3a3c` |
| Neutral filled tile | n/a | `#3a3a3c` |
| On-screen key | n/a | `#818384` |
| Divider rule | n/a | `#cccccc` |
| Floating card | `#ffffff` | `#121213` |

Accents seen in the reference but **not adopted**:
- greens `#6aaa64` / `#538d4e`
- yellows `#d1b036` / `#b59f3b`
- `#fbd300`

### Type (measured)
| Role | Size | Style |
|---|---|---|
| Wordmark (game name) | ~44px | Heavy slab serif |
| Tagline | ~36px, about 44px line height | Light serif |
| Dialog title | ~28px | Heavy slab serif |
| Dialog subtitle | ~20px | Regular |
| Body | 14–16px | Regular sans |
| Small caption | 12px | Regular sans |
| Tile letter | ~32px | Bold sans, uppercase |
| Key letter | ~20px (wide-key label 12px) | Bold sans, uppercase |
| Button | 16px | Semibold sans |

### Spacing and sizes (measured)
**Spacing**
- Everything sits on a **4px grid**.
- Gap between tiles: ~5px. Gap between keys: ~6px.
- Dialog padding: ~48px on the sides, ~40px on top.
- Gaps in the splash stack: ~16, 24 and 40px.

**Sizes**
- Board tile: 62×62px with a 2px border.
- Example tile in the dialog: ~40px.
- Key: 43×58px; a wide key is 65px.
- Pill button: 150×44px.

### Corners, shadows, layout
**Corners**
- Pills: fully round.
- Keys: 4px.
- Cards and dialogs: 8px.
- Tiles: square (0).

**Shadows:** almost none. Only a floating card or dialog gets a soft shadow of about `0 4px 23px rgb(0 0 0 / .2)`. This value is estimated, not measured.

**Layout**
- One centred column.
- Board ~330px wide.
- Keyboard up to ~500px.
- Dialog up to ~520px.
- Splash content is centred vertically.

### Motion (approximate)
| Event | Motion |
|---|---|
| Typed letter | Pops: scale 1 → 1.1 → 1, ~100ms |
| Reveal | Tile flips, ~250ms each, staggered |
| Invalid answer | Horizontal shake, ~600ms |
| Win | Small staggered bounce |

The overall feel is quick, crisp and never floaty.

---

## 2. Weld spec (the tokens)

All tokens live in [`src/app/globals.css`](src/app/globals.css).

Colours are CSS variables with a light and a dark value, so one class works in both modes:
- `bg-key` is light grey in light mode and `#818384` in dark mode.
- No `dark:` variant is needed for these colours.

### Colour
| Token → class | Light | Dark | Use for |
|---|---|---|---|
| `background` → `bg-background` | `#ffffff` | `#121213` | The page |
| `foreground` → `text-foreground` | `#171717` | `#f8f8f8` | Normal text |
| `muted` → `text-muted` | `#6b6e70` | `#9a9c9e` | Captions, hints, quiet text (both pass 4.5:1 contrast) |
| `surface-muted` → `bg-surface-muted` | `#e3e3e1` | `#1a1a1b` | Quiet panels, intro areas |
| `line` → `border-line` | `#d3d6da` | `#3a3a3c` | Dividers, outlines |
| `tile-border` → `border-tile-border` | `#d3d6da` | `#3a3a3c` | Empty letter tile |
| `key` → `bg-key` | `#d3d6da` | `#818384` | On-screen keys, neutral filled tiles |
| `ink` → `bg-ink` | `#121212` | `#f8f8f8` | Strong pill buttons (flips in dark) |
| `on-ink` → `text-on-ink` | `#ffffff` | `#121213` | Text on `bg-ink` |
| `accent` → `bg-accent` | emerald-500 | emerald-500 | Main action, good news, selected keys |
| `accent-text` → `text-accent-text` | emerald-700 | emerald-400 | Small green text ("New best!", "Host", "playing") |
| `danger` → `text-danger`, `bg-danger`, `border-danger` | red-600 | red-400 | Problems only: wrong word, errors, the last 30% of the timer |

**Rules**
- Emerald is for the main action and good news. Red is only for problems.
- Don't use `text-accent` for small text: emerald-500 is too light on white. Use `text-accent-text`.
- Don't add new colours in a component. Add a token here first.
- The one exception is amber for "heads-up" notes: the reconnecting banner and the localhost tip. These still use Tailwind's amber classes.

### Fonts
| Class | Font | Use for |
|---|---|---|
| `font-sans` (default) | Atkinson Hyperlegible Next | Everything: body, buttons, game letters |
| `font-display` | Zilla Slab 700 | Big headings only: the game name, screen titles |

Zilla Slab is a free (SIL Open Font Licence) heavy slab serif, chosen to give the chunky-heading look. Both fonts are loaded in [`src/app/layout.tsx`](src/app/layout.tsx) through `next/font`, so the fonts are served from our own site.

### Type scale
| Role | Class | Size |
|---|---|---|
| Hero number (letters, final score) | `text-7xl font-bold` | 72px |
| Game name, big | `font-display text-wordmark` | 44px |
| Game name in the top bar | `font-display text-3xl` | 30px |
| Screen title (one per screen) | `font-display text-display` (`ScreenHeader`) | 40px |
| Big choice ("Streak", "Sprint") | `font-display text-headline` | 32px |
| Tile letter | `text-tile font-bold uppercase` | 32px |
| Key letter | `text-keycap font-bold uppercase` | 20px |
| Body | `text-base` | 16px |
| Section heading | `font-display text-section` (`SectionHeading`, sentence case) | 22px |
| Caption | `text-sm text-muted` / `text-xs` | 14 / 12px |

### Spacing and sizes
**Spacing:** use Tailwind's default 4px scale (`gap-1` = 4px, `p-4` = 16px…).

| Use | Class |
|---|---|
| Between tiles | `gap-1` or `gap-1.5` |
| Between keys | `gap-1.5` |
| Inside a card | `p-4` |
| Inside a dialog | `px-12 pt-10 pb-8` |
| Between screen sections | `gap-8` |

**Fixed sizes**
| Thing | Class | Size |
|---|---|---|
| Letter tile (room code) | `size-tile`, plus `border-2 border-tile-border` | 62×62 |
| Required-letter tile (playing screen, landing example) | `LetterTile accent`: `border-3 border-accent` | 96×96 hero / 62×62 small |
| Hero letter tile (while playing) | `size-hero-tile text-7xl` | 96×96 |

**Start and end letters share one colour:** both get the emerald outline, matching the wordmark's W and d. Position, case and the captions tell them apart; a second hue would read as a status (red = problem). Outline, not fill: a filled green tile reads as "correct", and white on emerald is too low-contrast.
| Key height | `h-key` | 58px |
| Button height | `min-h-12` | 48px (keeps the 48px tap target, a little over the reference's 44) |

### Corners
| Thing | Class | Radius |
|---|---|---|
| Pill button | `rounded-full` | Fully round |
| On-screen key | `rounded-key` | 4px |
| Card, dialog | `rounded-card` | 8px |
| Letter tile | none | Square |

### Shadows
`shadow-card` is for a floating card or dialog only. Everything else stays flat; borders do the separating.

### Ready-made pieces in `src/components/ui.tsx`
Use these instead of repeating the classes:

| Piece | What it is |
|---|---|
| `ScreenHeader` | The one screen title (slab font, `text-display`) plus a `text-muted` subtitle |
| `SectionHeading` | A `text-sm font-semibold` heading above a list or picker |
| `Button` / `LinkButton` | Pill buttons (`BUTTON_BASE`). They come with the emerald focus ring, the hover state and a faded disabled state built in |
| `CHOICE_KEY` + `CHOICE_KEY_STATE` | A grey keyboard-style key you pick from a set (the mode keys). It turns `bg-accent` once selected |
| `LIST_CARD` | A bordered list card with thin lines between rows (high scores, players, standings) |
| `INPUT_BASE` + `INPUT_BORDER` | A text box with a 2px tile-style border. The border darkens while you type and turns red after a wrong try |
| `LetterTile` (in `LetterPair.tsx`) | One letter in a square tile, `hero` or `small` size |
| `StartCountdown` | The full-screen "3 · 2 · 1" before a game: the only thing on screen, "Get ready" above and the mode below. A slab (`font-display`) number in `text-countdown` (144px), `text-accent-text`. The old number shrinks out in 0.15s, then the new one pops in from 1.8× with a spring (a plain swap with reduce motion). The game then fades in. The answer box is already there, hidden (`sr-only`) and locked, so the phone keyboard is up when the game appears |

### Buttons
| Kind | Classes |
|---|---|
| Primary (main action) | `Button` → `rounded-full bg-accent text-white` |
| Secondary | `Button variant="secondary"` → `rounded-full border border-foreground`, with `bg-surface-muted` on hover |
| Strong neutral (not used yet) | `rounded-full bg-ink text-on-ink` |
| Choice key | `CHOICE_KEY` → `rounded-key bg-key text-keycap font-bold h-key` |

### Cards
| Kind | Classes |
|---|---|
| List card | `LIST_CARD`; the highlighted row gets `border-l-4 border-l-accent` |
| Chip (opponents while playing) | `rounded-full border border-line px-3 py-1 text-sm` |
| Dialog (none yet) | `rounded-card bg-background shadow-card max-w-modal px-12 pt-10 pb-8`, over a dark backdrop (`bg-black/60`) |
| Divider | `border-t border-line` (the top bar uses `border-b border-line`) |

### Layout
- **Phones and short screens:** the `compact:` variant (touch phones up to 767px wide, or any window under 720px tall). While you type, the phone keyboard covers the bottom half, so the playing screen moves to the **top** (`compact:justify-start`) and tightens: hero tiles drop to `size-tile`, gaps shrink, the "Points" label hides and the top bar gets smaller. The answer box then ends above the keyboard, so Safari doesn't scroll the letters out of view.
- **The page never scrolls.** `AppShell`'s outer box is exactly the visible height (`h-[var(--vvh,100dvh)]`, `overflow-hidden`). `useVisualViewportHeight` keeps `--vvh` equal to `window.visualViewport.height`, which shrinks when the phone keyboard opens, and undoes Safari's auto-scroll. The top bar is `shrink-0`; `<main>` is `flex-1 min-h-0 overflow-y-auto`, so a long screen scrolls inside it and the bar stays put. The playing screen is laid out from the top.
- **Tiny visible height:** the `tight:` variant (the hook sets `data-tight` on `<html>` below 420px visible, e.g. an iPhone SE with the keyboard open) hides the letter captions and the seconds text and shrinks the bar and score further.
- Text boxes stay at 16px or bigger (`text-lg`, `text-2xl`), or iPhones zoom in when you tap them.
- **Wordmark:** "Weld" in the slab font, with the **W** and **d** in `text-accent` (the bright emerald; fine here because the wordmark is big): the start and end letters, welded into one word.
- A full-width top bar (`h-16`, thin line under it) with the game name, from `AppShell`.
- One centred column below it. Content is no wider than `max-w-sm` for text.
- Use `max-w-xs` for buttons and lists.
- `max-w-board` (330px) for a row of tiles.
- `max-w-modal` (520px) for dialogs.
- Check every screen at phone width (~390px), in light and dark mode.

### Motion
Animations use `motion/react`. They are skipped when the player turns on "reduce motion".

| Event | Value | Where |
|---|---|---|
| Letter or tile pop | Spring (`stiffness: 400, damping: 15`), or a ~100ms scale 1 → 1.1 → 1 | Existing pops |
| Wrong answer | Horizontal shake | `SHAKE_X` / `SHAKE_DURATION` in `src/components/shake.ts` |
| Reveal or flip | ~250ms per tile, staggered | For future tiles |
| CSS transitions | `ease-snap` + `duration-150` | Hovers and small changes |

The feel: quick, crisp, a little bounce at the end, never floaty or slow.
