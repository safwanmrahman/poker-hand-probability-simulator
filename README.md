# Poker Hand Probability Simulator

A Texas Hold'em Monte Carlo simulator built with Next.js, TypeScript, Tailwind CSS, and Recharts.

## Features

- Interactive hero hole-card and community-board builder
- Shared 52-card deck with duplicate prevention across hero, board, and fixed seats
- Fixed or random opponent seat configuration for up to 9 opponents
- Worker-backed simulations with progress updates and cancel support
- Win, lose, tie, and made-hand probability reporting
- Recharts-powered outcome, comparison, and hand-breakdown visualizations
- Recent-run history with setup reload, saved-run comparison, and CSV/JSON export
- Local persistence for table state, run history, comparison selection, and theme preference

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Recharts
- Vitest

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

## Project Notes

- The simulation worker lives in `src/workers/simulation.worker.ts`
- Poker evaluation and Monte Carlo logic live in `src/lib/poker.ts`
- History export helpers live in `src/lib/history.ts`
- The main simulator interface lives in `src/app/page.tsx`

## Probability References

- Pokerology, “Poker Math & Probability: The Complete Guide”
  https://www.pokerology.com/poker/math/probability/
- Statistics LibreTexts, “13.2: Poker”
  https://stats.libretexts.org/Bookshelves/Probability_Theory/Probability_Mathematical_Statistics_and_Stochastic_Processes_%28Siegrist%29/13%3A_Games_of_Chance/13.02%3A_Poker
- arXiv, “Approximating Poker Probabilities with Deep Learning”
  https://arxiv.org/abs/1808.07220
- The ANZIAM Journal, “A simulation study of Texas hold 'em poker: what Taylor Swift understands and James Bond doesn't”
  https://www.cambridge.org/core/journals/anziam-journal/article/simulation-study-of-texas-hold-em-poker-what-taylor-swift-understands-and-james-bond-doesnt/CB91B0B6D5964E647D383749F1901DD9