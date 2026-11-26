# DESIGN.md

The visual design spec for Letter Bridge: colours, type, spacing, corners, shadows, buttons, cards, layout and motion.

**Why this file exists:** so every screen is built from the same small set of values. The values are defined once, as Tailwind theme tokens in [`src/app/globals.css`](src/app/globals.css). This file explains what each token is for. When you build a screen, use the theme classes (`bg-ink`, `rounded-card`, `text-tile`…), not raw hex codes or one-off pixel sizes.

The file has two parts:
1. **Reference observations**: what was measured from the screenshots in `design-ref/`.
2. **Letter Bridge spec**: the tokens we actually use, and the Tailwind class for each.

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

Letter Bridge keeps:
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

## 2. Letter Bridge spec (the tokens)

All tokens live in [`src/app/globals.css`](src/app/globals.css).

Colours are CSS variables with a light and a dark value, so one class works in both modes:
- `bg-key` is light grey in light mode and `#818384` in dark mode.
- No `dark:` variant is needed for these colours.

### Colour
| Token → class | Light | Dark | Use for |
|---|---|---|---|
| `background` → `bg-background` | `#ffffff` | `#121213` | The page |
| `foreground` → `text-foreground` | `#171717` | `#f8f8f8` | Normal text |
| `surface-muted` → `bg-surface-muted` | `#e3e3e1` | `#1a1a1b` | Quiet panels, intro areas |
| `line` → `border-line` | `#d3d6da` | `#3a3a3c` | Dividers, outlines |
| `tile-border` → `border-tile-border` | `#d3d6da` | `#3a3a3c` | Empty letter tile |
| `key` → `bg-key` | `#d3d6da` | `#818384` | On-screen keys, neutral filled tiles |
| `ink` → `bg-ink` | `#121212` | `#f8f8f8` | Strong pill buttons (flips in dark) |
| `on-ink` → `text-on-ink` | `#ffffff` | `#121213` | Text on `bg-ink` |
| `accent` → `bg-accent` | emerald-500 | emerald-500 | Main action, good news |

**Rules**
- Emerald is for the main action and good news. Red is only for problems.
- Muted captions keep using `text-zinc-500` until the restyle replaces them.
- Don't add new colours in a component. Add a token here first.

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
| Game name | `font-display text-wordmark` | 44px |
| Screen title (one per screen) | `font-display text-display` or `text-2xl font-bold` | 28 / 24px |
| Tile letter | `text-tile font-bold uppercase` | 32px |
| Key letter | `text-keycap font-bold uppercase` | 20px |
| Body | `text-base` | 16px |
| Section heading | `text-sm font-semibold` (sentence case) | 14px |
| Caption | `text-sm text-zinc-500` / `text-xs` | 14 / 12px |

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
| Letter tile | `size-tile`, plus `border-2 border-tile-border` | 62×62 |
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

### Buttons
| Kind | Classes |
|---|---|
| Primary (main action) | `rounded-full bg-accent text-white font-bold min-h-12 px-6` |
| Strong neutral | `rounded-full bg-ink text-on-ink font-bold min-h-12 px-6` |
| Secondary | `rounded-full border border-foreground font-bold min-h-12 px-6` |
| Key | `rounded-key bg-key text-keycap font-bold h-key` |

Every button keeps the emerald focus ring from `BUTTON_BASE` in [`src/components/ui.tsx`](src/components/ui.tsx).

### Cards
| Kind | Classes |
|---|---|
| Light card | `rounded-card bg-background p-4` on a `bg-surface-muted` area |
| Dialog | `rounded-card bg-background shadow-card max-w-modal px-12 pt-10 pb-8`, over a dark backdrop (`bg-black/60`) |
| Divider inside a card | `border-t border-line` |

### Layout
- One centred column. Content is no wider than `max-w-sm` for text.
- `max-w-board` (330px) for a row of tiles.
- `max-w-keyboard` (500px) for keys.
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
