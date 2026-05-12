import {
  clampIndex,
  createDefaultOpponentSeats,
  normalizeSeat,
} from "@/features/simulator/helpers";
import type { PersistedState, ThemeMode } from "@/features/simulator/types";

export const STORAGE_KEY = "poker-simulator-ui-state";
export const THEME_STORAGE_KEY = "poker-simulator-theme";

export function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedState = window.localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    return null;
  }

  try {
    const parsedState = JSON.parse(storedState) as Partial<PersistedState>;

    return {
      selectedHoleCards: [
        parsedState.selectedHoleCards?.[0] ?? null,
        parsedState.selectedHoleCards?.[1] ?? null,
      ],
      selectedBoardCards: [
        parsedState.selectedBoardCards?.[0] ?? null,
        parsedState.selectedBoardCards?.[1] ?? null,
        parsedState.selectedBoardCards?.[2] ?? null,
        parsedState.selectedBoardCards?.[3] ?? null,
        parsedState.selectedBoardCards?.[4] ?? null,
      ],
      activeTarget: parsedState.activeTarget ?? { area: "hole", slot: 0 },
      opponentCount: clampIndex(parsedState.opponentCount ?? 1, 9) || 1,
      opponentSeats: Array.from({ length: 9 }, (_, index) =>
        normalizeSeat(parsedState.opponentSeats?.[index]),
      ),
      simulationInput: parsedState.simulationInput ?? "25000",
      simulationResult: parsedState.simulationResult ?? null,
      runHistory: Array.isArray(parsedState.runHistory) ? parsedState.runHistory : [],
      comparisonRunId:
        typeof parsedState.comparisonRunId === "string" ||
        parsedState.comparisonRunId === null
          ? parsedState.comparisonRunId
          : null,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function loadThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    ? "dark"
    : "light";
}

export function buildPersistedState(
  state: Omit<PersistedState, "opponentSeats"> & { opponentSeats: PersistedState["opponentSeats"] },
) {
  return {
    ...state,
    opponentSeats: [
      ...state.opponentSeats,
      ...createDefaultOpponentSeats().slice(state.opponentSeats.length),
    ].slice(0, 9),
  } satisfies PersistedState;
}
