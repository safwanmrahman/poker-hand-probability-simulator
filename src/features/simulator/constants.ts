export const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

export const SUITS = [
  { code: "S", symbol: "♠", tone: "text-foreground" },
  { code: "H", symbol: "♥", tone: "text-red-700 dark:text-rose-300" },
  { code: "D", symbol: "♦", tone: "text-red-700 dark:text-rose-300" },
  { code: "C", symbol: "♣", tone: "text-foreground" },
] as const;

export const DECK = RANKS.flatMap((rank) =>
  SUITS.map((suit) => ({
    id: `${rank}${suit.code}`,
    rank,
    suit: suit.code,
    symbol: suit.symbol,
    tone: suit.tone,
    label: `${rank}${suit.symbol}`,
  })),
);

export const BOARD_STREETS = ["Flop 1", "Flop 2", "Flop 3", "Turn", "River"] as const;
export const MIN_SIMULATIONS = 1000;
export const MAX_SIMULATIONS = 250000;
export const LARGE_SIMULATION_WARNING_THRESHOLD = 100000;
export const SIMULATION_PRESETS = [5000, 25000, 100000] as const;
export const OPPONENT_PRESETS = [1, 3, 6, 9] as const;
export const STREET_PRESETS = [
  { label: "Deal Flop", count: 3 },
  { label: "Deal Turn", count: 4 },
  { label: "Deal River", count: 5 },
] as const;
export const SCENARIO_PRESETS = [
  {
    label: "Pocket Aces",
    holeCards: ["AS", "AH"],
    boardCards: [null, null, null, null, null],
    opponentCount: 3,
  },
  {
    label: "Big Slick Draw",
    holeCards: ["AS", "KS"],
    boardCards: ["QS", "JD", "2S", null, null],
    opponentCount: 2,
  },
  {
    label: "Set on Flop",
    holeCards: ["9C", "9D"],
    boardCards: ["9H", "KS", "2D", null, null],
    opponentCount: 4,
  },
] as const;
