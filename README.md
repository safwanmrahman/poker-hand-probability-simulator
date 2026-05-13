# Poker Hand Probability Simulator

A polished Texas Hold'em odds calculator that uses Monte Carlo simulation to estimate win, lose, tie, and made-hand frequencies against mixed fixed and random opponents.

Demo: `TODO: add deployed URL`

Additional screenshots:
- `TODO: add table-builder screenshot`
- `TODO: add results-and-charts screenshot`

## Features

- Interactive hero hole-card and board builder with duplicate prevention across the full deck
- Mixed opponent modeling with random seats and fully fixed known hands
- Web Worker-backed simulations with progress updates and cancel support
- Win / lose / tie reporting plus final hand distribution breakdown
- Saved recent runs with reload, comparison mode, and CSV / JSON export
- Persistent local UI state for the current table, history, comparison choice, and theme

## Tech Stack

- Frontend framework: Next.js 16 with React 19 App Router
- Language: TypeScript
- Styling approach: Tailwind CSS 4 with shared UI primitives and theme tokens in `globals.css`
- Charts / visualization: Recharts
- Testing: Vitest
- Build tooling: Next.js build pipeline, ESLint 9, PostCSS
- Simulation architecture: Monte Carlo engine in `src/lib/poker.ts` executed in `src/workers/simulation.worker.ts` so long-running trials do not block the UI thread

## How It Works

This project models a Texas Hold'em table state, then repeatedly completes the unknown cards with random legal draws from the remaining deck. Each trial evaluates the hero hand against every opponent hand and records whether the hero wins outright, loses to any opponent, or ties.

At a high level:

- Cards: Hero cards, community cards, and fixed opponent cards all come from one shared 52-card deck, so duplicates are prevented before a simulation starts.
- Opponents: Each seat can stay random or be locked to known hole cards. Random seats receive fresh sampled cards every trial.
- Trials: The simulator fills any missing board cards and any missing opponent cards, evaluates every 7-card final hand, and repeats this process for the requested number of trials.
- Probability estimates: Reported percentages are empirical estimates based on observed outcomes across the trial set, not closed-form exact odds.
- Hand outcomes: The latest run tracks win, lose, tie, and the hero's final made-hand distribution from high card through royal flush.

## Development

```bash
npm install
npm run dev
```

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
```

## Project Structure

```text
.
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
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