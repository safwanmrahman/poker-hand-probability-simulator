# Poker Hand Probability Simulator

A production-ready Texas Hold'em odds calculator built with Next.js. It runs entirely in the browser, uses a Web Worker for Monte Carlo simulations, and estimates win, lose, tie, and made-hand frequencies against mixed fixed and random opponents.

## Live Demo

https://poker-hand-probability-simulator.vercel.app/

## Features

- Interactive hero hole-card and board builder with duplicate prevention across the full deck
- Mixed opponent modeling with random seats and fully fixed known hands
- Web Worker-backed simulations with progress updates, cancellation support, and heavy-run safeguards
- Win / lose / tie reporting plus final hand distribution breakdown
- Saved recent runs with reload, comparison mode, and CSV / JSON export
- Persistent local UI state for the current table, history, comparison choice, and theme
- Stable first-paint theme hydration for light and dark mode in production

## Tech Stack

- Frontend framework: Next.js 16 with React 19 App Router
- Language: TypeScript
- Styling approach: Tailwind CSS 4 with shared UI primitives and theme tokens in `globals.css`
- Charts / visualization: Recharts
- Testing: Vitest
- Build tooling: Next.js build pipeline, ESLint 9, PostCSS
- Simulation architecture: Monte Carlo engine in `src/lib/poker.ts` executed in `src/workers/simulation.worker.ts` so long-running trials do not block the UI thread
- Deployment target: Static-compatible Next.js frontend with no required backend services and no required environment variables

## How It Works

This project models a Texas Hold'em table state, then repeatedly completes the unknown cards with random legal draws from the remaining deck. Each trial evaluates the hero hand against every opponent hand and records whether the hero wins outright, loses to any opponent, or ties.

At a high level:

- Cards: Hero cards, community cards, and fixed opponent cards all come from one shared 52-card deck, so duplicates are prevented before a simulation starts.
- Opponents: Each seat can stay random or be locked to known hole cards. Random seats receive fresh sampled cards every trial.
- Trials: The simulator fills any missing board cards and any missing opponent cards, evaluates every 7-card final hand, and repeats this process for the requested number of trials.
- Probability estimates: Reported percentages are empirical estimates based on observed outcomes across the trial set, not closed-form exact odds.
- Hand outcomes: The latest run tracks win, lose, tie, and the hero's final made-hand distribution from high card through royal flush.
- Performance: Simulations run in a dedicated worker so the main UI stays responsive during larger runs.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
```

## Production Notes

- The app is fully client-side at runtime. There is no API route, database, or backend service in this repository.
- No `.env` file is required for local development or deployment.
- Simulation counts are capped in the UI to keep production usage reasonable on typical devices.
- Recent runs and theme preference are stored in `localStorage` in the browser.

## Deployment

### Vercel

1. Import the repository into Vercel.
2. Keep the default Next.js framework preset.
3. Use these build settings if you need to enter them manually:

```text
Build command: npm run build
Install command: npm install
Output setting: Next.js default
```

4. Deploy. No environment variables are required.

### Netlify

1. Create a new site from the repository.
2. Set the build command to `npm run build`.
3. Set the publish directory to `.next`.
4. Make sure Netlify detects this as a Next.js site so the Next.js runtime/plugin is enabled.
5. Deploy. No environment variables are required.

If Netlify asks for framework details explicitly, choose `Next.js`.

## Project Structure

```text
.
├── public/
│   └── ...
├── src/
│   ├── app/
│   │   ├── apple-icon.tsx
│   │   ├── globals.css
│   │   ├── icon.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── results-charts.tsx
│   │   ├── simulator/
│   │   │   ├── hand-breakdown-list.tsx
│   │   │   ├── hero-header.tsx
│   │   │   ├── overview-panels.tsx
│   │   │   ├── playing-card.tsx
│   │   │   ├── recent-runs-panel.tsx
│   │   │   ├── results-sidebar.tsx
│   │   │   ├── setup-sidebar.tsx
│   │   │   ├── shared-deck.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── table-builder.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── section-title.tsx
│   ├── features/
│   │   └── simulator/
│   │       ├── constants.ts
│   │       ├── helpers.ts
│   │       ├── storage.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── history.ts
│   │   ├── poker.test.ts
│   │   ├── poker.ts
│   │   └── utils.ts
│   └── workers/
│       └── simulation.worker.ts
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

## Limitations

- Monte Carlo outputs are estimates, so results will vary slightly between runs.
- Lower trial counts complete faster but produce noisier probability estimates.
- Higher trial counts improve stability, but they still approximate true odds rather than computing exact combinatorics.
- The app currently focuses on Texas Hold'em hand-vs-hand simulation, not range-vs-range solving or betting strategy analysis.

## Probability References

- Pokerology, "Poker Math & Probability: The Complete Guide"  
  https://www.pokerology.com/poker/math/probability/
- Statistics LibreTexts, "13.2: Poker"  
  https://stats.libretexts.org/Bookshelves/Probability_Theory/Probability_Mathematical_Statistics_and_Stochastic_Processes_%28Siegrist%29/13%3A_Games_of_Chance/13.02%3A_Poker
- arXiv, "Approximating Poker Probabilities with Deep Learning"  
  https://arxiv.org/abs/1808.07220
- The ANZIAM Journal, "A simulation study of Texas hold 'em poker: what Taylor Swift understands and James Bond doesn't"  
  https://www.cambridge.org/core/journals/anziam-journal/article/simulation-study-of-texas-hold-em-poker-what-taylor-swift-understands-and-james-bond-doesnt/CB91B0B6D5964E647D383749F1901DD9
