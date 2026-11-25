# Letter Bridge

A fast word game. You get a **start letter** and an **end letter**, and you have to type a real word that bridges them before the timer runs out.

```
   A   …   e        ->   "astute" ✓   "able" ✓   "aeioue" ✗ (not a word)
```

Every correct word adds 1 to your streak and brings a new pair of letters. The game works in any modern browser and can be installed on a phone like an app.

## How to play

1. Pick how many seconds you get per word: **10**, **5** or **3**.
2. Type a word that **starts** with the first letter and **ends** with the second, then press Enter.
3. Keep going as long as you can. The game ends when:
   - the word isn't in the dictionary or has the wrong first or last letter, or
   - the timer runs out.

If you type a word that's **too short** (under 3 letters) or one you **already used** in this streak, the game doesn't end. The box shakes and you can try again, but the clock keeps running.

When the game ends you see why, plus a couple of words that would have worked. Your best streak is saved in your browser.

## Running it

**You need:** [Node.js](https://nodejs.org) 20.9 or newer (`node --version` to check).

```bash
npm install      # once, to download the packages
npm run dev      # start the game at http://localhost:3000
```

### All commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the game locally, reloading on every code change |
| `npm test` | Run all unit tests once (`npm run test:watch` re-runs them on every save) |
| `npm run lint` | Check the code style with ESLint |
| `npm run build` | Make the optimized production version (also checks types) |
| `npm start` | Serve that production version (run `build` first) |
| `npm run stats` | Print word-list numbers: dictionary size, letter pairs, and so on |
| `npm run dict:fetch` | Re-download the SCOWL word additions (see [The dictionary](#the-dictionary)) |
| `npm run clean` | Delete the `.next` build cache. Use it if `npm run dev` shows strange "module not found" errors. |

## Playing on a phone

- **Quick test on your Wi-Fi:**
  1. Run `npx next dev -H 0.0.0.0`.
  2. Find your computer's local IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux).
  3. Open `http://<that-ip>:3000` on the phone.
- **Install it as an app:** phones only offer *Add to Home Screen / Install* on **HTTPS** sites. The easiest way is a free [Vercel](https://vercel.com) deploy:
  1. Sign in to Vercel with GitHub and choose **Add New → Project**.
  2. Import this repository and keep the default settings (Vercel detects Next.js).
  3. Open the `https://….vercel.app` link on your phone, then tap **Install** (Android/Chrome) or **Share → Add to Home Screen** (iPhone/Safari).

  After that, every push to `main` redeploys automatically.

The game needs an internet connection to load the first time. Offline play (a service worker) is a possible future improvement.

## The dictionary

Answers are checked against about 189k words, merged from three files in [data/](data/):
- `enable1.txt`: the main list
- `scowl-additions.txt`: newer words like "selfie"
- `extra-words.txt`: words you add by hand, like "nile"

To make a word count, add it to [data/extra-words.txt](data/extra-words.txt) and restart `npm run dev`. To refresh the SCOWL words, run `npm run dict:fetch`. For sources, licenses and more maintenance tips, see [data/SOURCES.md](data/SOURCES.md).

The letter pairs come from a separate list of about 10,000 of the most common English words, with swear words removed (`data/common-10k.txt`). A pair is only offered if at least 15 common words fit it, so every prompt is solvable by a normal person.

The whole dictionary is downloaded once, and every check happens in your browser. That keeps answers instant, even on the 3-second timer.

## How the code is organized

```
data/                  word lists (the source of truth) + SOURCES.md
scripts/               helper commands: copy lists to public/, stats, dict:fetch, ...
src/
  lib/game/            THE GAME RULES. Plain TypeScript, no React, no browser.
    config.ts            every tunable number (time limits, min word length, ...)
    wordLists.ts         turn .txt files into a dictionary + letter-pair index
    letterPicker.ts      choose a fair random letter pair
    validator.ts         accept or reject an answer, and say why
    gameReducer.ts       the game's state machine (setup -> playing -> over)
    timer.ts             countdown math
  lib/browser/         download the word lists in the browser (once, cached)
  lib/node/            read the same lists from disk (for tests and scripts)
  hooks/               React glue: useGame, useCountdown, useWordData, useBestStreak
  components/          what you see: letters, timer bar, answer box, game over
  app/                 Next.js pages, plus the app icon and install manifest
tests/                 Vitest unit tests (mostly for lib/game)
```

The most important design choice is that **the rules in `src/lib/game` know nothing about React or the browser**. Two things follow from that:
- They can be tested with plain function calls.
- They can later run on a server unchanged, for example to judge answers in a multiplayer mode.

## Tech

[Next.js](https://nextjs.org) (App Router) · React · TypeScript · [Tailwind CSS](https://tailwindcss.com) · [Motion](https://motion.dev) for animations · [Vitest](https://vitest.dev) for tests · font: [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/), so a capital "I" and a lowercase "l" never look alike.

## License

The code is under the [MIT License](LICENSE). The word lists have their own (free) licenses, listed in [data/SOURCES.md](data/SOURCES.md).
