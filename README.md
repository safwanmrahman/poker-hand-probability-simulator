# Poker Hand Probability Simulator

A Texas Hold'em poker simulator built with Next.js, TypeScript, Tailwind CSS, and shadcn-style UI components.

The project is now in a working prototype stage. The app supports interactive table setup, real in-browser Monte Carlo simulations, saved local state, and responsive UI feedback during longer runs.

## Current Status

Implemented so far:

- Next.js app scaffold with TypeScript, Tailwind CSS, and App Router
- Responsive simulator dashboard layout
- Interactive hole card selection
- Interactive community board selection for flop, turn, and river
- Shared 52-card deck with duplicate prevention
- Simulation count input with presets and validation
- Opponent count controls and quick scenario presets
- Real Monte Carlo simulation engine for Texas Hold'em
- Poker hand evaluation for final 7-card hands
- Live win, lose, and tie probabilities
- Final hand-type probability breakdown
- Non-blocking simulation runs with progress updates and cancel support
- Results overview cards and charts driven by simulation output
- Random full-table dealing
- Street helpers for dealing flop, turn, and river
- Reset and clear actions for hole cards and board cards
- Local persistence with `localStorage` so the table state survives refreshes

Not implemented yet:

- Production charting library integration
- Additional poker variants or multi-player seat configuration beyond hero vs random opponents
- Deeper result history, comparison tools, or export features

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `lucide-react`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Project Structure

```text
poker-hand-probability-simulator/
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
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── input.tsx
│   └── lib/
│       ├── poker.ts
│       └── utils.ts
├── components.json
├── eslint.config.mjs
├── LICENSE
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

## Current UI Features

### Card Selection

- Choose 2 hole cards
- Choose up to 5 community cards
- Switch between active hole-card and board-card slots
- Prevent duplicate card selection across the full table

### Table Setup Helpers

- Deal a random complete setup
- Auto-deal flop
- Auto-deal turn
- Auto-deal river
- Clear individual slots
- Clear all hole cards
- Clear the full board
- Reset the whole table

### Simulation Flow

- Enter a simulation count between `1,000` and `500,000`
- Use quick presets like `5,000`, `25,000`, and `100,000`
- Choose between `1` and `9` opponents
- Use quick scenario presets like pocket aces and draw-heavy flops
- Run a real Monte Carlo simulation in the browser
- See progress updates during long runs
- Cancel an in-progress run
- View simulated win, lose, and tie percentages
- View simulated final hand distribution and result summaries

## Notes

- The simulator is being built incrementally with small and medium-sized commits.
- The current simulation runs entirely on the client.
- A good next step would be improving charting, adding richer analytics, or moving heavy simulation work off the main thread.
