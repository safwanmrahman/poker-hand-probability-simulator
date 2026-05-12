import type { MonteCarloResult } from "@/lib/poker";

export type ThemeMode = "light" | "dark";
export type OpponentMode = "random" | "known";

export type OpponentSeat = {
  mode: OpponentMode;
  cards: (string | null)[];
};

export type ActiveTarget =
  | { area: "hole"; slot: number }
  | { area: "board"; slot: number }
  | { area: "opponent"; seat: number; slot: number };

export type RunHistoryEntry = {
  id: string;
  createdAt: string;
  summary: string;
  result: MonteCarloResult;
  setup: {
    selectedHoleCards: string[];
    selectedBoardCards: string[];
    opponentCount: number;
    opponentSeats: OpponentSeat[];
  };
};

export type PersistedState = {
  selectedHoleCards: (string | null)[];
  selectedBoardCards: (string | null)[];
  activeTarget: ActiveTarget;
  opponentCount: number;
  opponentSeats: OpponentSeat[];
  simulationInput: string;
  simulationResult: MonteCarloResult | null;
  runHistory: RunHistoryEntry[];
  comparisonRunId: string | null;
};

export type SimulationWorkerMessage =
  | {
      type: "progress";
      completedSimulations: number;
      totalSimulations: number;
      progress: number;
    }
  | {
      type: "done";
      result: MonteCarloResult;
    }
  | {
      type: "error";
      message: string;
    };
