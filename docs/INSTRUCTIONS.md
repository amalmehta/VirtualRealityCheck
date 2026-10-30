# Instructions

## Use it

Open https://amalmehta.github.io/VirtualRealityCheck/ and press **Start**. Takes about 10 minutes.

1. **Guess.** For each of eight numbers, enter your guess and the value that would bother you. Don't look anything up yet.
2. **Check.** Look up each real number using the directions on screen. If you can't check one, press **Can't check this**; it's left out, not counted against you.
3. **Read the result, and write down one change.** Retake it in about two weeks. Drift only shows between two checks.

Hours can be typed the way your phone shows them: `4.5`, `4h 30m`, `45m`. Everything saves as you type, so you can switch apps.

Shortcuts: **Enter** moves on, **⌘,** opens Settings. Some browsers keep ⌘, for themselves; the Settings button always works.

## Your data

Stored only in this browser's local storage. No account, server or analytics. Anyone using this browser profile can see it. In Settings you can export it, import it (button, drag a file anywhere, or paste a file) and delete everything. Exports aren't encrypted.

## Run it locally

```bash
npm start
```

Then open http://localhost:4173. No build step.

## Test it

```bash
npm install
```

```bash
npm test
```

```bash
npm run test:e2e
```

Browser tests use Playwright, pinned in `package.json`. If it asks for browsers, run `npx playwright install`.

## Publish it

GitHub Pages serves the `main` branch from the root. Pushing to `main` publishes.

## Change the content

All questions, directions, sources and suggestions are in `js/measures.js`. After changing `assets/icon.svg`, run `node scripts/render-icons.mjs`.
