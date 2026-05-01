# Poker Hand Probability Simulator

A Texas Hold'em poker simulator built with Next.js, TypeScript, Tailwind CSS, and shadcn-style UI components.

The project is currently in an in-progress UI and workflow stage. The app already supports interactive card selection, table setup helpers, and placeholder result panels, but it does not yet run real Monte Carlo poker logic.

## Current Status

Implemented so far:

- Next.js app scaffold with TypeScript, Tailwind CSS, and App Router
- Responsive simulator dashboard layout
- Interactive hole card selection
- Interactive community board selection for flop, turn, and river
- Shared 52-card deck with duplicate prevention
- Simulation count input with presets and validation
- Placeholder results flow wired into the UI
- Results overview cards and hand-type breakdown driven by app state
- Placeholder chart panels that react to current selections
- Random full-table dealing
- Street helpers for dealing flop, turn, and river
- Reset and clear actions for hole cards and board cards
- Local persistence with `localStorage` so the table state survives refreshes

Not implemented yet:

- Real Monte Carlo simulation engine
- Poker hand evaluation and winner calculation
- True win / lose / tie odds
- Real hand-type probability breakdown
- Production charting library integration

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
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
  lib/
    utils.ts
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

### Placeholder Simulation Flow

- Enter a simulation count between `1,000` and `500,000`
- Use quick presets like `5,000`, `25,000`, and `100,000`
- Run a placeholder simulation pass
- Show state-driven placeholder win, lose, and tie numbers
- Show placeholder final hand distribution and chart panels

## Notes

- Current probabilities are generated placeholders for UI development only.
- The simulator is being built incrementally with small and medium-sized commits.
- The next major step is replacing the placeholder result generation with real poker simulation logic.
