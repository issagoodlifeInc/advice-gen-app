# Advice generator — rebuild report (Monday, Nov 23, 2026)

Built locally in `~/workspace/goals/daily-coding-practice/advice-gen-app/`
from Lesley's own repo `issagoodlifeInc/advice-gen-app` (starting commit
`e5b3161`), after her explicit go-ahead to install, build and test it.

## What changed, file by file

**TypeScript conversion (still Create React App / react-scripts — no framework switch)**
- `src/App.js` → `src/App.tsx` — rewritten in TypeScript, porting the
  November 22 preview faithfully (see below). Also fixes the original bug
  where `setAdvice(fetchData())` stored a promise instead of a slip.
- `src/index.js` → `src/index.tsx` — same entry point, now typed, with
  `React.StrictMode` and a root-element check.
- `src/components/Footer.js` → `src/components/Footer.tsx` — same footer,
  `class` fixed to `className`.
- `tsconfig.json` (new) — strict TypeScript, `jsx: react-jsx`.
- `src/react-app-env.d.ts` (new) — CRA's standard SVG-import declarations
  (the original JS repo never had one; `tsc` needed it).
- `package.json` — added `typescript` + `@types/react` + `@types/react-dom`
  as devDependencies, a `"proxy": "http://localhost:5001"` for the backend,
  and an `npm run server` script. `package-lock.json` updated.
- `public/index.html` — Manrope weights widened to 500;600;700;800 (the
  preview uses them).

**Preview features ported into the React app**
- No headline at the top — just the language switch, stretched end-to-end,
  English / Kiswahili / Kalenjin as equal thirds. The Kalenjin button
  scrolls to the Kalenjin draft section; it is not a live advice language.
- Advice from `api.adviceslip.com` via Axios, no repeat twice in a row
  (retries up to 3 times), loading skeleton, error box with retry, and
  clearly-labelled example slips if the API can't be reached on first load.
- Dice button alone gives new advice. Below the card: Save, Copy, Share,
  Bible Advice — nothing else.
- Kiswahili via MyMemory (en → sw), cached by Advice ID. The 24 seeded
  translations from the preview are in `src/data/swahiliCache.ts`; the same
  ID is never re-translated. English stays shown with a note if translation
  fails.
- Favourites now use the backend (see below), with copy/remove per item,
  clear-all, and a count. If the server isn't running, the app says so —
  it does **not** silently fall back to localStorage.
- Kalenjin section: one AI-drafted example only, marked "AI-drafted —
  awaiting human review": *"Don't keep all your eggs in one basket."* →
  *"Matiny maaiyeguk tugul eng' itoget ake."*, with the grain/granary
  cultural note and the Swahili reference *"Usiweke mayai yako yote kwenye
  kikapu kimoja"*. No Kalenjin text is stored in favourites.
- Bible Advice: 18 NIV verses in `src/data/bibleVerses.ts`, matched to the
  current advice by topic keywords; if nothing matches closely, a random
  verse is shown with a note saying so. Copy verse included.
- `src/styles.css` — the preview's stylesheet, lifted verbatim (same dark
  blue / card / light cyan / neon green palette), plus two small additions:
  the dice icon and divider now also match `<img>` elements, since the
  React app uses the original SVG files.
- New data/API modules: `src/types.ts`, `src/data/fallbacks.ts`,
  `src/data/kalenjin.ts`, `src/api/favourites.ts`.

**Backend + database (new) — `server/`**
- `server/index.js` — Express + Node's built-in `node:sqlite` (Node 24).
  SQLite file `server/favourites.db` (gitignored — it's Lesley's data).
  Table: `favourites(advice_id INTEGER PRIMARY KEY, advice_en TEXT NOT
  NULL, advice_sw TEXT, created_at TEXT)`. No Kalenjin column, on purpose.
- `server/package.json`, `server/README.md` — how to run it and the API.
- API: `GET /api/favourites` · `POST /api/favourites`
  `{adviceId, adviceEn, adviceSw?}` (saving the same advice twice updates
  it, doesn't duplicate) · `DELETE /api/favourites/:adviceId` (404 if not
  saved) · `DELETE /api/favourites`.
- `.gitignore` — added `server/favourites.db`, `server/node_modules`,
  `build/`.

## How to run it

```bash
cd advice-gen-app
npm install          # app dependencies (already installed here)
npm run build        # or: npm start   (dev server, http://localhost:3000)

cd server
npm install          # backend dependencies (already installed here)
node index.js        # favourites server on http://localhost:5001
```

Run both together in development: the app in one terminal (`npm start`),
the server in another (`npm run server` from the app folder). Favourites
only work while the server is running.

## What was verified (Nov 23, ~17:45 UTC)

- `npm install` (app): 1407 packages, only peer-dependency warnings.
- `npx tsc --noEmit`: clean (after adding `react-app-env.d.ts`; the only
  errors before that were missing SVG type declarations).
- `CI=false npm run build`: "Compiled successfully" — 103.91 kB JS (gzip),
  2.76 kB CSS. The bundle contains the Kalenjin, Bible Advice,
  `/api/favourites` and MyMemory-guard strings.
- Server + all 4 API endpoints, tested with curl against real favourites:
  POST → 201 (and upsert on repeat POST), GET → list newest first,
  invalid POST → 400, DELETE one → 204, DELETE missing → 404,
  DELETE all → 204 then GET → `[]`. Test favourites were deleted
  afterwards; the database is empty (0 rows).
- Advice Slip API is reachable from here — live call returned slip #36.
- Built app served locally: index → 200, main JS bundle → 200, and the
  API round-tripped (POST 201 → GET → DELETE 204) while it was up.

## Gaps / things to know

- **MyMemory free quota was exhausted when tested** (shared-IP daily
  limit — "YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY, NEXT
  AVAILABLE IN ~15 HOURS"). The app now explicitly refuses to cache that
  warning message as a translation (a bug found during testing — the
  warning text would otherwise have been stored as the "Swahili" text).
  The 24 seeded translations still cover the common advice IDs, and
  English stays shown with a note for the rest until the quota resets.
- The live app was only verified by serving the built files and curling
  them — no browser click-through was done here. The dice, language
  switch, Save and Bible Advice buttons need a quick manual tap-through
  on Lesley's machine (or in the dev server) before pushing.
- The Netlify live site (`advise-gen-app.netlify.app`) still serves the
  old version. This build does not deploy anywhere; deploying the
  frontend + the backend together still needs a decision (the SQLite
  server can't run on Netlify's static hosting as-is).

## What was NOT done

- No push to GitHub, no branch created, no deploy. The work sits only in
  this local folder; the repo is still on branch `master` at `e5b3161`,
  with the changes above uncommitted. Nothing in `issagoodlifeInc` was
  touched remotely.
