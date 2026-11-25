# Letter Bridge

A fast word game. You get a **start letter** and an **end letter**, and you have to type a real word that bridges them before the timer runs out.

```
   A   …   e        ->   "astute" ✓   "able" ✓   "aeioue" ✗ (not a word)
```

Every correct word adds 1 to your streak and brings a new pair of letters. The game works in any modern browser and can be installed on a phone like an app.

## How to play

The landing page has two buttons: **Play solo** and **Play with friends**.

1. Choose **Play solo**, then pick how many seconds you get per word: **10**, **5** or **3**.
2. Type a word that **starts** with the first letter and **ends** with the second, then press Enter.
3. Keep going as long as you can. The game ends when:
   - the word isn't in the dictionary or has the wrong first or last letter, or
   - the timer runs out.

If you type a word that's **too short** (under 3 letters) or one you **already used** in this streak, the game doesn't end. The box shakes and you can try again, but the clock keeps running.

When the game ends you see why, plus a couple of words that would have worked. Your top 5 streaks for each time limit (with the words you used) are saved in your browser as high scores.

### Playing with friends

Choose **Play with friends**, then **Create a room**, and share the 5-letter code or invite link with up to 3 friends. They choose **Play with friends** too and type the code under **Have a code?**, open the link, or **scan the QR code** in the waiting room with their phone camera, then pick a nickname. The first player in the room is the host: they choose the seconds per word and press **Start game**.

Everyone then gets the **same letter pairs in the same order** and plays their own streak on their own timer, with the others' streaks shown live above the letters. The usual rules apply: a wrong word or running out of time knocks you out, and too-short or repeated words are only warnings. When everyone is out, the **highest streak wins** (on a tie, whoever lasted longer). The host can then start a **rematch**.

Answers are checked twice: instantly in your browser, and again by the room server with the same rules and dictionary. The server's verdict is final, so editing the page can't fake a streak.

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
| `npm run party:dev` | Start the multiplayer room server locally on port 8787 (run it next to `npm run dev`) |
| `npm run dev:lan` / `npm run party:dev:lan` | The same two servers, reachable from phones on your Wi-Fi (see [Playing on a phone](#playing-on-a-phone)) |
| `npm run party:check` | Type-check the room server |
| `npm run party:types` | Regenerate the room server's Cloudflare types (after changing `wrangler.jsonc`) |
| `npm run party:deploy` | Deploy the room server to Cloudflare (needs your own Cloudflare account) |

### Running multiplayer locally

Multiplayer rooms run on a small separate server, so you need **two terminals**:

```bash
npm run dev         # the game, at http://localhost:3000
npm run party:dev   # the room server, at localhost:8787
```

Open two browser windows (one of them private/incognito, so each gets its own nickname), create a room in one and join it from the other. No Cloudflare account is needed for local play.

### Putting multiplayer online

The game itself goes on Vercel (see [Playing on a phone](#playing-on-a-phone)); the room server goes on Cloudflare. Both have free tiers that are plenty for this.

1. **Deploy the room server:** run `npm run party:deploy`. The first time, it opens a browser to log in to (or create) a free Cloudflare account. When it finishes it prints the address, e.g. `https://letter-bridge-rooms.<you>.workers.dev`.
2. **Point the game at it:** in your Vercel project, go to **Settings → Environment Variables** and add `NEXT_PUBLIC_PARTY_HOST` = that address **without** `https://` (e.g. `letter-bridge-rooms.<you>.workers.dev`). See [.env.example](.env.example).
3. **Redeploy** the game on Vercel (the variable is baked in at build time).

Rooms then work from anywhere, over a secure connection, and the waiting room's QR code points at your real site. Run `npm run party:deploy` again whenever you change the room server (`party/` or `src/lib/multiplayer/`, or the game rules it shares).

### When connections drop

- **Reload or lose signal briefly:** you're put back in your seat automatically (a small "Reconnecting…" banner shows meanwhile), even mid-game with your streak and current letters. Your round clock restarts when you're back; if you're away longer than the round's time, you're out as if time ran out.
- **Seats are kept for 20 seconds.** In the waiting room or on the results screen, a seat that stays empty longer is freed. **Leave room** frees it immediately.
- **The host can remove players** from the waiting room (the **Remove** link next to their name).
- **Arriving late:** if the room is full or a game is already running, you watch the live standings instead, and get a seat automatically when the host starts the next game.

## Playing on a phone

- **Quick test on your Wi-Fi:**
  1. Run `npm run dev:lan` (and `npm run party:dev:lan` for multiplayer). These are like `dev` / `party:dev`, but reachable from other devices on your network.
  2. Find your computer's local IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux).
  3. Open `http://<that-ip>:3000` on the phone, or on the computer: then a room's **QR code** points phones at the right address and they can just scan it.

  Phones are allowed in for `192.168.x.x` and `10.x.x.x` addresses (see `allowedDevOrigins` in `next.config.ts`). If your network uses another range, add it there. Windows may ask to let Node.js through the firewall the first time: allow it on private networks.
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
    random.ts            seeded random numbers: same seed = same letter pairs
    timer.ts             countdown math
  lib/multiplayer/     ROOM RULES, also plain TypeScript (shared with the room server)
    room.ts              the room's state machine (lobby, answers, timeouts, results, rematch)
    protocol.ts          the messages the browser and room server exchange
  lib/browser/         download the word lists in the browser (once, cached)
  lib/node/            read the same lists from disk (for tests and scripts)
  hooks/               React glue: useGame, useCountdown, useWordData, useHighScores, useRoom
  components/          what you see: letters, timer bar, answer box, game over, room lobby
  app/                 Next.js pages: / (landing), /solo, /friends, /room/<code>; plus icons and manifest
party/                 the multiplayer room server (Cloudflare Durable Object via PartyServer)
tests/                 Vitest unit tests (lib/game and lib/multiplayer)
```

The most important design choice is that **the rules in `src/lib/game` know nothing about React or the browser**. Two things follow from that:
- They can be tested with plain function calls.
- They run on the room server unchanged: `party/server.ts` imports the same `lib/game` and `lib/multiplayer` code the browser uses.

## Tech

[Next.js](https://nextjs.org) (App Router) · React · TypeScript · [Tailwind CSS](https://tailwindcss.com) · [Motion](https://motion.dev) for animations · [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) on Cloudflare Durable Objects for multiplayer rooms · [Vitest](https://vitest.dev) for tests · font: [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/), so a capital "I" and a lowercase "l" never look alike.

## License

The code is under the [MIT License](LICENSE). The word lists have their own (free) licenses, listed in [data/SOURCES.md](data/SOURCES.md).
