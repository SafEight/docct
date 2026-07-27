# DOCCT

**Play online:** https://docct-cn5.pages.dev/

Recreation of https://docct.pages.dev built fully automatically by AI.
I did not look at any of the code, so proceed at your own risk.

## Changes from original

- Accent color changed to emerald green
- Set custom session duration (type any number, not just 5/10/15 min presets)
- Mobile keypad supports swipe-to-select, held-answer input, and touch-cancel safeguards
- Optional Sequential 6×3 keypad layout, while preserving the existing Classic layout as the default
- Fixed pacing mode keeps the selected interval constant, regardless of correct or wrong streaks
- More aggressive adaptive difficulty curve, so interval changes faster and is displayed with 2-decimal precision
- Wrong-answer sound options: None / Beep / Fart 💨 (8 random variations) — in case beep wasn't annoying enough
- Progress ring fills up to the next digit in visual mode
- Mobile keypad supports swipe-to-select (drag and release) instead of individual taps

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm install
npm run build
```

Static output is written to `build/`. Serve it with any static file server, e.g.:

```bash
npx serve build
```

## Docker

```bash
docker build -t docct .
docker run -p 8080:80 docct
```

Open `http://localhost:8080`.

## Tests

```bash
npm install
npm test
```

## Tech Stack

- SvelteKit (Svelte 5 runes)
- Tailwind CSS v4
- Chart.js
- TypeScript
- Vitest
