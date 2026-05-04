"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import {
  ArrowRight,
  CheckCircle2,
  CircleOff,
  Download,
  GitCompareArrows,
  History,
  MoonStar,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  SunMedium,
  TrendingUp,
  Users,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildRunHistoryCsv } from "@/lib/history";
import { HAND_LABELS, type MonteCarloResult } from "@/lib/poker";
import { cn } from "@/lib/utils";

const ResultsCharts = dynamic(
  () => import("@/components/results-charts").then((module) => module.ResultsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {["Outcome Chart", "Comparison Chart", "Hand Breakdown"].map((label, index) => (
          <div
            key={label}
            className={
              index === 2
                ? "rounded-[1.75rem] border border-border bg-card/88 p-5 xl:col-span-2"
                : "rounded-[1.75rem] border border-border bg-card/88 p-5"
            }
          >
            <h3 className="text-base font-semibold">{label}</h3>
            <div className="mt-4 h-72 rounded-2xl bg-muted/60" />
          </div>
        ))}
      </div>
    ),
  },
);

const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = [
  { code: "S", symbol: "♠", tone: "text-foreground" },
  { code: "H", symbol: "♥", tone: "text-red-600 dark:text-rose-300" },
  { code: "D", symbol: "♦", tone: "text-red-600 dark:text-rose-300" },
  { code: "C", symbol: "♣", tone: "text-foreground" },
] as const;

const DECK = RANKS.flatMap((rank) =>
  SUITS.map((suit) => ({
    id: `${rank}${suit.code}`,
    rank,
    suit: suit.code,
    symbol: suit.symbol,
    tone: suit.tone,
    label: `${rank}${suit.symbol}`,
  })),
);

const BOARD_STREETS = ["Flop 1", "Flop 2", "Flop 3", "Turn", "River"] as const;
const SIMULATION_PRESETS = [5000, 25000, 100000] as const;
const OPPONENT_PRESETS = [1, 3, 6, 9] as const;
const STREET_PRESETS = [
  { label: "Deal Flop", count: 3 },
  { label: "Deal Turn", count: 4 },
  { label: "Deal River", count: 5 },
] as const;
const SCENARIO_PRESETS = [
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

type ThemeMode = "light" | "dark";
type OpponentMode = "random" | "known";

type OpponentSeat = {
  mode: OpponentMode;
  cards: (string | null)[];
};

type ActiveTarget =
  | { area: "hole"; slot: number }
  | { area: "board"; slot: number }
  | { area: "opponent"; seat: number; slot: number };

type RunHistoryEntry = {
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

type PersistedState = {
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

type SimulationWorkerMessage =
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

const STORAGE_KEY = "poker-simulator-ui-state";
const THEME_STORAGE_KEY = "poker-simulator-theme";

function createDefaultOpponentSeats() {
  return Array.from({ length: 9 }, () => ({
    mode: "random" as OpponentMode,
    cards: [null, null],
  }));
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function clampIndex(index: number, max: number) {
  return Math.min(Math.max(index, 0), max);
}

function shuffleCards(cardIds: string[]) {
  const shuffled = [...cardIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function normalizeSeat(seat: Partial<OpponentSeat> | undefined): OpponentSeat {
  return {
    mode: seat?.mode === "known" ? "known" : "random",
    cards: [seat?.cards?.[0] ?? null, seat?.cards?.[1] ?? null],
  };
}

function loadPersistedState(): PersistedState | null {
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
      runHistory: parsedState.runHistory ?? [],
      comparisonRunId: parsedState.comparisonRunId ?? null,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function loadThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    ? "dark"
    : "light";
}

function formatCards(cardIds: (string | null)[]) {
  return cardIds.filter(Boolean).join(" ") || "No cards selected";
}

function getTopHandLabels(handBreakdown: number[]) {
  return HAND_LABELS.map((label, index) => ({
    label,
    value: handBreakdown[index] ?? 0,
  }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
}

function getCardDetails(cardId: string | null) {
  return DECK.find((card) => card.id === cardId) ?? null;
}

function getUsedCards(
  selectedHoleCards: (string | null)[],
  selectedBoardCards: (string | null)[],
  opponentSeats: OpponentSeat[],
  opponentCount: number,
) {
  return new Set(
    [
      ...selectedHoleCards,
      ...selectedBoardCards,
      ...opponentSeats
        .slice(0, opponentCount)
        .flatMap((seat) => (seat.mode === "known" ? seat.cards : [])),
    ].filter(Boolean),
  );
}

function getKnownSeatCount(opponentSeats: OpponentSeat[], opponentCount: number) {
  return opponentSeats
    .slice(0, opponentCount)
    .filter((seat) => seat.mode === "known")
    .length;
}

function downloadTextFile(fileName: string, contents: string, contentType: string) {
  const blob = new Blob([contents], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

function PlayingCard({
  value,
  caption,
  accent,
  active = false,
  filled = false,
  isDarkMode = false,
}: {
  value: string;
  caption: string;
  accent?: string;
  active?: boolean;
  filled?: boolean;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={[
        "flex h-24 w-[4.6rem] flex-col justify-between rounded-2xl border p-3 text-left shadow-sm transition-all sm:h-28 sm:w-[5rem]",
        filled
          ? isDarkMode
            ? "bg-slate-900/90 text-slate-100 shadow-none"
            : "bg-[linear-gradient(180deg,#fffdfa,#f6efe4)] text-slate-900 shadow-[0_16px_30px_-22px_rgba(29,22,16,0.35)]"
          : isDarkMode
            ? "bg-slate-900/70 text-slate-300"
            : "bg-stone-100 text-slate-700",
        active
          ? "border-primary shadow-[0_12px_30px_-18px_rgba(15,118,110,0.65)] ring-2 ring-primary/20"
          : "border-border",
      ].join(" ")}
    >
      <span
        className={cn(
          "text-base font-semibold tracking-[0.18em]",
          !accent && isDarkMode ? "text-slate-100" : "",
          accent ?? "",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.22em]",
          isDarkMode ? "text-muted-foreground" : "text-stone-500",
        )}
      >
        {caption}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone,
  isDarkMode,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isDarkMode
          ? "border-white/10 bg-slate-950/60 shadow-none"
          : "border-stone-200 bg-white shadow-[0_16px_40px_-28px_rgba(29,20,12,0.18)]",
      )}
    >
      <div className={cn("mb-3 h-2 rounded-full", tone)} />
      <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-stone-700")}>
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold",
          isDarkMode ? "text-foreground" : "text-slate-950",
        )}
      >
        {value}
      </p>
      <p className={cn("mt-2 text-sm", isDarkMode ? "text-muted-foreground" : "text-stone-600")}>
        {detail}
      </p>
    </div>
  );
}

export default function Home() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [selectedHoleCards, setSelectedHoleCards] = useState<(string | null)[]>([
    null,
    null,
  ]);
  const [selectedBoardCards, setSelectedBoardCards] = useState<(string | null)[]>(
    [null, null, null, null, null],
  );
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({
    area: "hole",
    slot: 0,
  });
  const [opponentCount, setOpponentCount] = useState(1);
  const [opponentSeats, setOpponentSeats] = useState<OpponentSeat[]>(
    createDefaultOpponentSeats(),
  );
  const [simulationInput, setSimulationInput] = useState("25000");
  const [simulationResult, setSimulationResult] = useState<MonteCarloResult | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const [comparisonRunId, setComparisonRunId] = useState<string | null>(null);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [completedSimulations, setCompletedSimulations] = useState(0);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const simulationWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setThemeMode(loadThemeMode());

      const persistedState = loadPersistedState();

      if (persistedState) {
        setSelectedHoleCards(persistedState.selectedHoleCards);
        setSelectedBoardCards(persistedState.selectedBoardCards);
        setActiveTarget(persistedState.activeTarget);
        setOpponentCount(persistedState.opponentCount);
        setOpponentSeats(persistedState.opponentSeats);
        setSimulationInput(persistedState.simulationInput);
        setSimulationResult(persistedState.simulationResult);
        setRunHistory(persistedState.runHistory);
        setComparisonRunId(persistedState.comparisonRunId);
      }

      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const nextState: PersistedState = {
      selectedHoleCards,
      selectedBoardCards,
      activeTarget,
      opponentCount,
      opponentSeats,
      simulationInput,
      simulationResult,
      runHistory,
      comparisonRunId,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, [
    activeTarget,
    comparisonRunId,
    hasHydrated,
    opponentCount,
    opponentSeats,
    runHistory,
    selectedBoardCards,
    selectedHoleCards,
    simulationInput,
    simulationResult,
  ]);

  useEffect(() => {
    return () => {
      simulationWorkerRef.current?.terminate();
      simulationWorkerRef.current = null;
    };
  }, []);

  const visibleOpponentSeats = opponentSeats.slice(0, opponentCount);
  const usedCards = getUsedCards(
    selectedHoleCards,
    selectedBoardCards,
    opponentSeats,
    opponentCount,
  );
  const holeCardsSelected = selectedHoleCards.filter(Boolean).length;
  const boardCardsSelected = selectedBoardCards.filter(Boolean).length;
  const remainingDeckCount = DECK.length - usedCards.size;
  const parsedSimulationCount = Number.parseInt(simulationInput, 10);
  const isSimulationCountValid =
    Number.isFinite(parsedSimulationCount) &&
    parsedSimulationCount >= 1000 &&
    parsedSimulationCount <= 500000;
  const isOpponentCountValid = opponentCount >= 1 && opponentCount <= 9;
  const hasBoardGap = selectedBoardCards.some(
    (card, index) => card === null && selectedBoardCards.slice(index + 1).some(Boolean),
  );
  const hasPartialKnownSeat = visibleOpponentSeats.some(
    (seat) =>
      seat.mode === "known" &&
      seat.cards.filter(Boolean).length > 0 &&
      seat.cards.filter(Boolean).length < 2,
  );
  const hiddenOpponentSeats = Math.max(opponentCount - getKnownSeatCount(opponentSeats, opponentCount), 0);
  const boardCardsNeeded = 5 - boardCardsSelected;
  const randomCardsNeeded =
    boardCardsNeeded +
    visibleOpponentSeats.reduce((total, seat) => {
      if (seat.mode !== "known") {
        return total + 2;
      }

      return total + Math.max(2 - seat.cards.filter(Boolean).length, 0);
    }, 0);
  const hasEnoughCardsRemaining = remainingDeckCount >= randomCardsNeeded;
  const canRunSimulation =
    holeCardsSelected === 2 &&
    !hasBoardGap &&
    !hasPartialKnownSeat &&
    isSimulationCountValid &&
    isOpponentCountValid &&
    hasEnoughCardsRemaining;
  const boardStage =
    boardCardsSelected === 0
      ? "Preflop"
      : boardCardsSelected <= 3
        ? "Flop"
        : boardCardsSelected === 4
          ? "Turn"
          : "River";
  const activeTargetLabel =
    activeTarget.area === "hole"
      ? `Hero card ${activeTarget.slot + 1}`
      : activeTarget.area === "board"
        ? BOARD_STREETS[activeTarget.slot]
        : `Opponent ${activeTarget.seat + 1} card ${activeTarget.slot + 1}`;
  const opponentSummary =
    visibleOpponentSeats
      .map((seat, index) =>
        seat.mode === "known"
          ? `O${index + 1}: ${formatCards(seat.cards)}`
          : `O${index + 1}: random`,
      )
      .join(" • ") || "No opponents";
  const scenarioSummary = [
    formatCards(selectedHoleCards),
    formatCards(selectedBoardCards),
    `vs ${opponentCount} opponent${opponentCount === 1 ? "" : "s"}`,
    boardStage,
  ].join(" • ");
  const comparisonEntry = runHistory.find((entry) => entry.id === comparisonRunId) ?? null;
  const resultSummary =
    simulationResult ?? {
      win: 0,
      lose: 0,
      tie: 0,
      handBreakdown: HAND_LABELS.map(() => 0),
      simulations: isSimulationCountValid ? parsedSimulationCount : 0,
      opponents: isOpponentCountValid ? opponentCount : 0,
      elapsedMs: 0,
    };
  const outcomeStats = [
    {
      label: "Win",
      value: formatPercent(resultSummary.win),
      detail: isRunningSimulation ? "Updating in background" : "Hero wins all opponents",
      tone: "bg-emerald-500",
    },
    {
      label: "Lose",
      value: formatPercent(resultSummary.lose),
      detail: isRunningSimulation ? "Updating in background" : "Any opponent beats hero",
      tone: "bg-slate-800 dark:bg-slate-400",
    },
    {
      label: "Tie",
      value: formatPercent(resultSummary.tie),
      detail: isRunningSimulation ? "Updating in background" : "Hero shares the pot",
      tone: "bg-amber-500",
    },
  ];
  const handBreakdown = HAND_LABELS.map((label, index) => [
    label,
    resultSummary.handBreakdown[index],
  ] as const);
  const topHandLabels = getTopHandLabels(resultSummary.handBreakdown);
  const isDarkMode = themeMode === "dark";
  const panelCardClass = isDarkMode
    ? "border-white/10 bg-slate-950/55 shadow-none"
    : "border-stone-200 bg-white shadow-[0_20px_60px_-36px_rgba(30,20,10,0.14)]";
  const insetPanelClass = isDarkMode
    ? "border-white/10 bg-slate-950/50"
    : "border-stone-200 bg-stone-50";
  const mutedPanelClass = isDarkMode
    ? "border-white/10 bg-muted/20"
    : "border-stone-200 bg-stone-50";
  const outlineButtonClass = isDarkMode
    ? "border-white/10 bg-slate-950/45 text-foreground hover:bg-slate-900"
    : "border-stone-200 bg-white text-slate-900 hover:bg-stone-100 shadow-[0_10px_24px_-18px_rgba(29,20,12,0.14)]";
  const heroRunButtonClass = isDarkMode
    ? "border-white/10 bg-slate-950/60 text-foreground hover:bg-slate-950/70 disabled:border-white/10 disabled:bg-slate-950/60 disabled:text-foreground disabled:opacity-100"
    : "border-white/16 bg-white text-secondary hover:bg-white/92 disabled:!border-white/20 disabled:!bg-white disabled:!text-slate-900 disabled:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.35)] disabled:opacity-100";
  const strongTextClass = isDarkMode ? "text-foreground" : "text-slate-950";
  const mutedTextClass = isDarkMode ? "text-muted-foreground" : "text-stone-700";
  const softTextClass = isDarkMode ? "text-muted-foreground" : "text-stone-600";
  const bestOutcome =
    outcomeStats.slice().sort((left, right) => {
      const leftValue = Number.parseFloat(left.value);
      const rightValue = Number.parseFloat(right.value);
      return rightValue - leftValue;
    })[0];
  const statusMessage =
    holeCardsSelected < 2
      ? "Choose both hero hole cards to unlock simulations."
      : hasBoardGap
        ? "Fill the community board from left to right so the street state stays valid."
        : hasPartialKnownSeat
          ? "Known opponent seats need both cards filled before a run can start."
          : !hasEnoughCardsRemaining
            ? "This table setup uses too many fixed cards for the remaining deck."
            : !isOpponentCountValid
              ? "Choose between 1 and 9 opponents."
              : !isSimulationCountValid
                ? "Enter a simulation count between 1,000 and 500,000."
                : simulationError
                  ? simulationError
                  : "Selections look valid. You can run the simulation now.";

  function clearSimulationState() {
    setSimulationResult(null);
    setSimulationError(null);
    setSimulationProgress(0);
    setCompletedSimulations(0);
  }

  function toggleThemeMode() {
    setThemeMode((currentMode) => (currentMode === "light" ? "dark" : "light"));
  }

  function updateSeat(
    seatIndex: number,
    updater: (seat: OpponentSeat) => OpponentSeat,
  ) {
    setOpponentSeats((currentSeats) =>
      currentSeats.map((seat, index) =>
        index === seatIndex ? updater(seat) : seat,
      ),
    );
  }

  function setScenarioPreset(preset: (typeof SCENARIO_PRESETS)[number]) {
    setSelectedHoleCards([...preset.holeCards]);
    setSelectedBoardCards([...preset.boardCards]);
    setOpponentCount(preset.opponentCount);
    setOpponentSeats(createDefaultOpponentSeats());
    setActiveTarget({ area: "board", slot: 0 });
    clearSimulationState();
  }

  function assignCardToTarget(cardId: string) {
    if (isRunningSimulation) {
      return;
    }

    if (activeTarget.area === "hole") {
      setSelectedHoleCards((currentCards) =>
        currentCards.map((card, index) =>
          index === activeTarget.slot ? cardId : card,
        ),
      );
    }

    if (activeTarget.area === "board") {
      setSelectedBoardCards((currentCards) =>
        currentCards.map((card, index) =>
          index === activeTarget.slot ? cardId : card,
        ),
      );
    }

    if (activeTarget.area === "opponent") {
      updateSeat(activeTarget.seat, (seat) => ({
        mode: "known",
        cards: seat.cards.map((card, index) =>
          index === activeTarget.slot ? cardId : card,
        ),
      }));
    }

    clearSimulationState();
  }

  function clearHoleSlot(slotIndex: number) {
    setSelectedHoleCards((currentCards) =>
      currentCards.map((card, index) => (index === slotIndex ? null : card)),
    );
    setActiveTarget({ area: "hole", slot: slotIndex });
    clearSimulationState();
  }

  function clearBoardSlot(slotIndex: number) {
    setSelectedBoardCards((currentCards) =>
      currentCards.map((card, index) => (index === slotIndex ? null : card)),
    );
    setActiveTarget({ area: "board", slot: slotIndex });
    clearSimulationState();
  }

  function clearOpponentSlot(seatIndex: number, slotIndex: number) {
    updateSeat(seatIndex, (seat) => ({
      ...seat,
      cards: seat.cards.map((card, index) => (index === slotIndex ? null : card)),
    }));
    setActiveTarget({ area: "opponent", seat: seatIndex, slot: slotIndex });
    clearSimulationState();
  }

  function clearAllHoleCards() {
    setSelectedHoleCards([null, null]);
    setActiveTarget({ area: "hole", slot: 0 });
    clearSimulationState();
  }

  function clearAllBoardCards() {
    setSelectedBoardCards([null, null, null, null, null]);
    setActiveTarget({ area: "board", slot: 0 });
    clearSimulationState();
  }

  function clearAllOpponentSeats() {
    setOpponentSeats(createDefaultOpponentSeats());
    setActiveTarget({ area: "opponent", seat: 0, slot: 0 });
    clearSimulationState();
  }

  function resetTable() {
    setSelectedHoleCards([null, null]);
    setSelectedBoardCards([null, null, null, null, null]);
    setActiveTarget({ area: "hole", slot: 0 });
    setOpponentCount(1);
    setOpponentSeats(createDefaultOpponentSeats());
    setSimulationInput("25000");
    setComparisonRunId(null);
    clearSimulationState();
  }

  function dealRandomSetup() {
    const shuffledDeck = shuffleCards(DECK.map((card) => card.id));

    setSelectedHoleCards(shuffledDeck.slice(0, 2));
    setSelectedBoardCards(shuffledDeck.slice(2, 7));
    setOpponentSeats(createDefaultOpponentSeats());
    setActiveTarget({ area: "board", slot: 4 });
    clearSimulationState();
  }

  function dealBoardThrough(targetCount: number) {
    const availableCards = shuffleCards(
      DECK.map((card) => card.id).filter((cardId) => !usedCards.has(cardId)),
    );
    const nextBoardCards = [...selectedBoardCards];
    let deckIndex = 0;

    for (let index = 0; index < targetCount; index += 1) {
      if (nextBoardCards[index] !== null) {
        continue;
      }

      nextBoardCards[index] = availableCards[deckIndex] ?? null;
      deckIndex += 1;
    }

    setSelectedBoardCards(nextBoardCards);
    setActiveTarget({ area: "board", slot: clampIndex(targetCount - 1, 4) });
    clearSimulationState();
  }

  function setOpponentSeatMode(seatIndex: number, mode: OpponentMode) {
    updateSeat(seatIndex, () => ({
      mode,
      cards: mode === "known" ? [null, null] : [null, null],
    }));
    setActiveTarget({ area: "opponent", seat: seatIndex, slot: 0 });
    clearSimulationState();
  }

  function loadHistoryEntry(entry: RunHistoryEntry) {
    const nextSeats = createDefaultOpponentSeats().map((seat, index) =>
      normalizeSeat(entry.setup.opponentSeats[index] ?? seat),
    );

    setSelectedHoleCards([
      entry.setup.selectedHoleCards[0] ?? null,
      entry.setup.selectedHoleCards[1] ?? null,
    ]);
    setSelectedBoardCards([
      entry.setup.selectedBoardCards[0] ?? null,
      entry.setup.selectedBoardCards[1] ?? null,
      entry.setup.selectedBoardCards[2] ?? null,
      entry.setup.selectedBoardCards[3] ?? null,
      entry.setup.selectedBoardCards[4] ?? null,
    ]);
    setOpponentCount(entry.setup.opponentCount);
    setOpponentSeats(nextSeats);
    setActiveTarget({ area: "hole", slot: 0 });
    setSimulationResult(entry.result);
    setSimulationProgress(100);
    setCompletedSimulations(entry.result.simulations);
    setSimulationError(null);
    setComparisonRunId(entry.id);
  }

  function exportHistory() {
    if (runHistory.length === 0) {
      return;
    }

    downloadTextFile(
      "poker-simulation-history.csv",
      buildRunHistoryCsv(runHistory),
      "text/csv;charset=utf-8",
    );
  }

  function exportLatestResult() {
    if (!simulationResult) {
      return;
    }

    downloadTextFile(
      "poker-latest-result.json",
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          summary: scenarioSummary,
          result: simulationResult,
          comparisonRunId,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  }

  function runSimulation() {
    if (!canRunSimulation || isRunningSimulation) {
      return;
    }

    simulationWorkerRef.current?.terminate();
    setIsRunningSimulation(true);
    setSimulationProgress(0);
    setCompletedSimulations(0);
    setSimulationResult(null);
    setSimulationError(null);

    const heroHoleCards = selectedHoleCards.filter(
      (cardId): cardId is string => cardId !== null,
    );
    const boardCards = selectedBoardCards.filter(
      (cardId): cardId is string => cardId !== null,
    );
    const knownOpponentHoleCards = visibleOpponentSeats.map((seat) =>
      seat.mode === "known"
        ? seat.cards.filter((cardId): cardId is string => cardId !== null)
        : [],
    );
    const summary = [
      formatCards(selectedHoleCards),
      formatCards(selectedBoardCards),
      `vs ${opponentCount} opponent${opponentCount === 1 ? "" : "s"}`,
      `${parsedSimulationCount.toLocaleString()} trials`,
    ].join(" • ");

    const worker = new Worker(
      new URL("../workers/simulation.worker.ts", import.meta.url),
      { type: "module" },
    );

    simulationWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
      if (event.data.type === "progress") {
        setCompletedSimulations(event.data.completedSimulations);
        setSimulationProgress(event.data.progress);
        return;
      }

      if (event.data.type === "done") {
        const completedResult = event.data.result;

        setSimulationResult(completedResult);
        setRunHistory((currentHistory) =>
          [
            {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              summary,
              result: completedResult,
              setup: {
                selectedHoleCards: heroHoleCards,
                selectedBoardCards: boardCards,
                opponentCount,
                opponentSeats: visibleOpponentSeats.map((seat) => ({
                  mode: seat.mode,
                  cards: [...seat.cards],
                })),
              },
            },
            ...currentHistory,
          ].slice(0, 12),
        );
        setSimulationProgress(100);
        setCompletedSimulations(completedResult.simulations);
        setIsRunningSimulation(false);
        worker.terminate();
        simulationWorkerRef.current = null;
        return;
      }

      setSimulationError(event.data.message);
      setIsRunningSimulation(false);
      worker.terminate();
      simulationWorkerRef.current = null;
    };

    worker.onerror = () => {
      setSimulationError("Simulation worker crashed. Try running the simulation again.");
      setIsRunningSimulation(false);
      worker.terminate();
      simulationWorkerRef.current = null;
    };

    worker.postMessage({
      type: "run",
      heroHoleCards,
      boardCards,
      knownOpponentHoleCards,
      simulations: parsedSimulationCount,
      opponents: opponentCount,
    });
  }

  function cancelSimulation() {
    simulationWorkerRef.current?.terminate();
    simulationWorkerRef.current = null;
    setIsRunningSimulation(false);
    setSimulationProgress(0);
    setCompletedSimulations(0);
    setSimulationError("Simulation cancelled.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="grid gap-6">
        <header
          className={cn(
            "flex flex-col gap-4 rounded-[2rem] border p-5 sm:p-6",
            isDarkMode
              ? "border-white/10 bg-card/88 shadow-[0_20px_80px_-45px_rgba(0,0,0,0.5)]"
              : "border-stone-200 bg-white shadow-[0_24px_80px_-44px_rgba(35,23,10,0.18)]",
          )}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Texas Hold&apos;em Monte Carlo
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className={cn("gap-2", outlineButtonClass)}
                  onClick={toggleThemeMode}
                >
                  {themeMode === "light" ? (
                    <>
                      <MoonStar className="size-4" />
                      Dark mode
                    </>
                  ) : (
                    <>
                      <SunMedium className="size-4" />
                      Light mode
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={cn("gap-2", outlineButtonClass)}
                  onClick={dealRandomSetup}
                  disabled={isRunningSimulation}
                >
                  <WandSparkles className="size-4" />
                  Deal random table
                </Button>
                <Button
                  variant="outline"
                  className={cn("gap-2", outlineButtonClass)}
                  onClick={resetTable}
                  disabled={isRunningSimulation}
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-none text-3xl font-semibold tracking-tight sm:text-4xl lg:text-6xl">
                Simulate poker odds with fixed seats, exportable history, and real charts.
              </h1>
              <p className={cn("max-w-none text-base leading-7 sm:text-xl", mutedTextClass)}>
                Build the table, lock in specific opponent hands when needed, then run
                worker-backed simulations without giving up responsive UI feedback.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[1.6rem] border border-border bg-[linear-gradient(135deg,rgba(15,118,110,0.96),rgba(22,48,43,0.94))] p-5 text-white shadow-[0_24px_70px_-32px_rgba(12,74,110,0.45)]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 uppercase tracking-[0.2em]">
                    {boardStage}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1">
                    {parsedSimulationCount.toLocaleString()} trials
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1">
                    {opponentCount} opponent{opponentCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1">
                    {getKnownSeatCount(opponentSeats, opponentCount)} fixed seat
                    {getKnownSeatCount(opponentSeats, opponentCount) === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
                  <div className="flex gap-3">
                    {selectedHoleCards.map((cardId, index) => {
                      const card = getCardDetails(cardId);
                      return (
                        <button
                          key={`hero-card-${index}`}
                          type="button"
                          onClick={() => setActiveTarget({ area: "hole", slot: index })}
                          className="text-left"
                          disabled={isRunningSimulation}
                        >
                          <PlayingCard
                            value={card ? `${card.rank}${card.symbol}` : "--"}
                            caption={`Hero ${index + 1}`}
                            accent={card?.tone}
                            active={
                              activeTarget.area === "hole" && activeTarget.slot === index
                            }
                            filled={Boolean(card)}
                            isDarkMode={isDarkMode}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-white/82">{scenarioSummary}</p>
                    <p className="text-sm leading-6 text-white/70">{opponentSummary}</p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className={heroRunButtonClass}
                        onClick={runSimulation}
                        disabled={!canRunSimulation || isRunningSimulation}
                      >
                        {isRunningSimulation ? "Running simulation..." : "Run simulation"}
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                      {isRunningSimulation ? (
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-white/18 bg-white/10 text-white hover:bg-white/16"
                          onClick={cancelSimulation}
                        >
                          Cancel run
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {outcomeStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  detail={stat.detail}
                  tone={stat.tone}
                  isDarkMode={isDarkMode}
                />
              ))}
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  isDarkMode
                    ? "border-white/10 bg-slate-950/60 shadow-none"
                    : "border-stone-200 bg-white shadow-[0_16px_40px_-28px_rgba(29,20,12,0.18)]",
                )}
              >
                <div className="mb-3 h-2 rounded-full bg-primary/35" />
                <p className={cn("text-sm", mutedTextClass)}>Run status</p>
                <p className={cn("mt-2 text-2xl font-semibold", strongTextClass)}>
                  {isRunningSimulation ? `${simulationProgress}%` : "Ready"}
                </p>
                <p className={cn("mt-2 text-sm", softTextClass)}>
                  {isRunningSimulation
                    ? `${completedSimulations.toLocaleString()} trials complete`
                    : simulationResult
                      ? `${simulationResult.elapsedMs} ms last run`
                      : "Awaiting first simulation"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle>Setup Summary</CardTitle>
                <CardDescription>
                  The table is now aware of fixed opponents as part of the setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
                  <p className={cn("text-sm font-medium", strongTextClass)}>Table status</p>
                  <p className={cn("mt-2 text-sm leading-6", mutedTextClass)}>
                    {holeCardsSelected}/2 hero cards selected, {boardCardsSelected}/5 board
                    cards selected, {remainingDeckCount} cards still available.
                  </p>
                  <p className={cn("mt-2 text-sm leading-6", mutedTextClass)}>
                    {statusMessage}
                  </p>
                  {simulationError ? (
                    <p className="mt-2 text-sm leading-6 text-red-700 dark:text-rose-300">
                      {simulationError}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                    <p className={cn("text-sm", mutedTextClass)}>Active target</p>
                    <p className="mt-1 text-lg font-semibold">{activeTargetLabel}</p>
                  </div>
                  <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                    <p className={cn("text-sm", mutedTextClass)}>Best outcome</p>
                    <p className="mt-1 text-lg font-semibold">
                      {bestOutcome.label} {bestOutcome.value}
                    </p>
                  </div>
                  <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                    <p className={cn("text-sm", mutedTextClass)}>Seat mix</p>
                    <p className="mt-1 text-lg font-semibold">
                      {getKnownSeatCount(opponentSeats, opponentCount)} fixed / {hiddenOpponentSeats} random
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SCENARIO_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className={outlineButtonClass}
                      onClick={() => setScenarioPreset(preset)}
                      disabled={isRunningSimulation}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle>Simulation Controls</CardTitle>
                <CardDescription>
                  Set volume, seat count, and export the results you care about.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <label htmlFor="simulations" className="text-sm font-medium text-foreground">
                    Number of simulations
                  </label>
                  <Input
                    id="simulations"
                    type="number"
                    value={simulationInput}
                    onChange={(event) => setSimulationInput(event.target.value)}
                    placeholder="25000"
                    disabled={isRunningSimulation}
                  />
                  <div className="flex flex-wrap gap-2">
                    {SIMULATION_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        className={outlineButtonClass}
                        onClick={() => setSimulationInput(String(preset))}
                        disabled={isRunningSimulation}
                      >
                        {preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="opponents" className="text-sm font-medium text-foreground">
                    Number of opponents
                  </label>
                  <Input
                    id="opponents"
                    type="number"
                    min="1"
                    max="9"
                    value={String(opponentCount)}
                    onChange={(event) =>
                      setOpponentCount(
                        clampIndex(Number.parseInt(event.target.value || "1", 10) || 1, 9),
                      )
                    }
                    placeholder="1"
                    disabled={isRunningSimulation}
                  />
                  <div className="flex flex-wrap gap-2">
                    {OPPONENT_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        className={outlineButtonClass}
                        onClick={() => setOpponentCount(preset)}
                        disabled={isRunningSimulation}
                      >
                        {preset} opponent{preset === 1 ? "" : "s"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={cn("rounded-2xl border p-4 text-sm", mutedPanelClass)}>
                    <p className={cn("font-medium", strongTextClass)}>Run readiness</p>
                    <p className={cn("mt-2", mutedTextClass)}>
                      {canRunSimulation ? "Ready to simulate" : "Needs input"}
                    </p>
                  </div>
                  <div className={cn("rounded-2xl border p-4 text-sm", mutedPanelClass)}>
                    <p className={cn("font-medium", strongTextClass)}>Worker status</p>
                    <p className={cn("mt-2", mutedTextClass)}>
                      {isRunningSimulation ? "Running in background" : "Idle"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="w-full"
                    onClick={runSimulation}
                    disabled={!canRunSimulation || isRunningSimulation}
                  >
                    <Play className="mr-2 size-4" />
                    {isRunningSimulation ? "Simulating..." : "Simulate"}
                  </Button>
                  <Button
                    variant="outline"
                    className={outlineButtonClass}
                    onClick={resetTable}
                    disabled={isRunningSimulation}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Reset
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className={outlineButtonClass}
                    onClick={exportHistory}
                    disabled={runHistory.length === 0}
                  >
                    <Download className="mr-2 size-4" />
                    Export history
                  </Button>
                  <Button
                    variant="outline"
                    className={outlineButtonClass}
                    onClick={exportLatestResult}
                    disabled={!simulationResult}
                  >
                    <Download className="mr-2 size-4" />
                    Export latest
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle>Table Builder</CardTitle>
                <CardDescription>
                  Hero cards, board cards, and fixed opponent seats all use the same deck.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Hero hole cards</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className={outlineButtonClass}
                      onClick={clearAllHoleCards}
                      disabled={isRunningSimulation}
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedHoleCards.map((cardId, index) => {
                      const card = getCardDetails(cardId);

                      return (
                        <div
                          key={`hole-slot-${index}`}
                          className={`rounded-2xl border p-4 ${
                            activeTarget.area === "hole" && activeTarget.slot === index
                              ? "border-primary bg-primary/5"
                              : cn("border", insetPanelClass)
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveTarget({ area: "hole", slot: index })}
                            className="flex w-full items-start gap-4 text-left"
                            disabled={isRunningSimulation}
                          >
                            <PlayingCard
                              value={card ? `${card.rank}${card.symbol}` : "--"}
                              caption={`Hero ${index + 1}`}
                              accent={card?.tone}
                              active={
                                activeTarget.area === "hole" && activeTarget.slot === index
                              }
                              filled={Boolean(card)}
                              isDarkMode={isDarkMode}
                            />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Hero slot {index + 1}</p>
                              <p className={cn("text-sm", mutedTextClass)}>
                                {card ? card.label : "Choose a card from the deck"}
                              </p>
                            </div>
                          </button>
                          {cardId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn("mt-4 w-full", outlineButtonClass)}
                              onClick={() => clearHoleSlot(index)}
                              disabled={isRunningSimulation}
                            >
                              Clear slot
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">Community board</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={outlineButtonClass}
                        onClick={clearAllBoardCards}
                        disabled={isRunningSimulation}
                      >
                        Clear board
                      </Button>
                      {STREET_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          className={outlineButtonClass}
                          onClick={() => dealBoardThrough(preset.count)}
                          disabled={isRunningSimulation}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {selectedBoardCards.map((cardId, index) => {
                      const card = getCardDetails(cardId);

                      return (
                        <div
                          key={`board-slot-${index}`}
                          className={`rounded-2xl border p-4 ${
                            activeTarget.area === "board" && activeTarget.slot === index
                              ? "border-accent bg-accent/8"
                              : cn("border", insetPanelClass)
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveTarget({ area: "board", slot: index })}
                            className="space-y-3 text-left"
                            disabled={isRunningSimulation}
                          >
                            <p className="text-sm font-medium">{BOARD_STREETS[index]}</p>
                            <PlayingCard
                              value={card ? `${card.rank}${card.symbol}` : "--"}
                              caption={boardStage}
                              accent={card?.tone}
                              active={
                                activeTarget.area === "board" && activeTarget.slot === index
                              }
                              filled={Boolean(card)}
                              isDarkMode={isDarkMode}
                            />
                            <p className={cn("text-sm", mutedTextClass)}>
                              {card ? card.label : "Choose a card"}
                            </p>
                          </button>
                          {cardId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn("mt-4 w-full", outlineButtonClass)}
                              onClick={() => clearBoardSlot(index)}
                              disabled={isRunningSimulation}
                            >
                              Clear slot
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">Opponent seats</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className={outlineButtonClass}
                      onClick={clearAllOpponentSeats}
                      disabled={isRunningSimulation}
                    >
                      Clear opponents
                    </Button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {visibleOpponentSeats.map((seat, seatIndex) => (
                      <div
                        key={`opponent-seat-${seatIndex}`}
                        className={cn("rounded-2xl border p-4", insetPanelClass)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Opponent {seatIndex + 1}</p>
                            <p className={cn("mt-1 text-sm", mutedTextClass)}>
                              {seat.mode === "known"
                                ? "Cards are fixed into the simulation."
                                : "Seat remains random for every trial."}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={seat.mode === "random" ? "secondary" : "outline"}
                              size="sm"
                              className={seat.mode === "random" ? "" : outlineButtonClass}
                              onClick={() => setOpponentSeatMode(seatIndex, "random")}
                              disabled={isRunningSimulation}
                            >
                              Random
                            </Button>
                            <Button
                              variant={seat.mode === "known" ? "secondary" : "outline"}
                              size="sm"
                              className={seat.mode === "known" ? "" : outlineButtonClass}
                              onClick={() => setOpponentSeatMode(seatIndex, "known")}
                              disabled={isRunningSimulation}
                            >
                              Fixed
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          {seat.cards.map((cardId, slotIndex) => {
                            const card = getCardDetails(cardId);
                            const isActive =
                              activeTarget.area === "opponent" &&
                              activeTarget.seat === seatIndex &&
                              activeTarget.slot === slotIndex;

                            return (
                              <div key={`seat-${seatIndex}-slot-${slotIndex}`} className="space-y-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveTarget({
                                      area: "opponent",
                                      seat: seatIndex,
                                      slot: slotIndex,
                                    })
                                  }
                                  disabled={seat.mode !== "known" || isRunningSimulation}
                                  className={cn(
                                    seat.mode !== "known"
                                      ? "cursor-not-allowed opacity-60"
                                      : "text-left",
                                  )}
                                >
                                  <PlayingCard
                                    value={card ? `${card.rank}${card.symbol}` : "--"}
                                    caption={`Opp ${slotIndex + 1}`}
                                    accent={card?.tone}
                                    active={isActive}
                                    filled={Boolean(card)}
                                    isDarkMode={isDarkMode}
                                  />
                                </button>
                                {cardId ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={outlineButtonClass}
                                    onClick={() => clearOpponentSlot(seatIndex, slotIndex)}
                                    disabled={isRunningSimulation}
                                  >
                                    Clear
                                  </Button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle>Shared Deck</CardTitle>
                <CardDescription>
                  Click any available card to place it into the current active slot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
                    mutedPanelClass,
                  )}
                >
                  <p className={cn("font-medium", strongTextClass)}>
                    Active target: <span className="text-primary">{activeTargetLabel}</span>
                  </p>
                  <p className={mutedTextClass}>{remainingDeckCount} cards available</p>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {DECK.map((card) => {
                    const isUsed = usedCards.has(card.id);

                    return (
                      <button
                        key={card.id}
                        type="button"
                        disabled={isUsed || isRunningSimulation}
                        onClick={() => assignCardToTarget(card.id)}
                        className={`rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-colors ${
                          isUsed || isRunningSimulation
                            ? isDarkMode
                              ? "cursor-not-allowed border-white/10 bg-muted/45 text-muted-foreground line-through opacity-70"
                              : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-500 line-through opacity-70"
                            : isDarkMode
                              ? "border-white/10 bg-slate-950/55 text-foreground hover:border-primary/40 hover:bg-primary/12"
                              : "border-stone-200 bg-white text-slate-900 hover:border-primary/40 hover:bg-primary/6"
                        }`}
                      >
                        <span className={card.tone}>{card.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  Results
                </CardTitle>
                <CardDescription>
                  Core odds, run state, and saved comparisons stay together.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {outcomeStats.map((stat) => (
                    <StatCard
                      key={`results-${stat.label}`}
                      label={stat.label}
                      value={stat.value}
                      detail={
                        isRunningSimulation
                          ? "Worker updating this result"
                          : simulationResult
                            ? "Latest simulation"
                            : "Awaiting run"
                      }
                      tone={stat.tone}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={cn("text-sm font-medium", strongTextClass)}>Progress</p>
                      <p className={cn("mt-1 text-sm", mutedTextClass)}>
                        {isRunningSimulation
                          ? `${completedSimulations.toLocaleString()} / ${parsedSimulationCount.toLocaleString()} trials`
                          : simulationResult
                            ? `${simulationResult.simulations.toLocaleString()} completed`
                            : "No simulation run yet"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-semibold", strongTextClass)}>
                        {simulationProgress}%
                      </p>
                      <p className={cn("text-xs", softTextClass)}>
                        {isRunningSimulation ? "In progress" : "Last known"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-[width] duration-200"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Result Details
                </CardTitle>
                <CardDescription>
                  Strongest outcomes, speed, and comparison deltas in one view.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Best outcome</p>
                  <p className="mt-1 text-lg font-semibold">
                    {bestOutcome.label} {bestOutcome.value}
                  </p>
                </div>
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Most frequent made hand</p>
                  <p className="mt-1 text-lg font-semibold">
                    {topHandLabels[0]?.label ?? "N/A"}
                  </p>
                  <p className={cn("mt-1 text-sm", mutedTextClass)}>
                    {topHandLabels[0] ? formatPercent(topHandLabels[0].value) : "0.0%"}
                  </p>
                </div>
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Run speed</p>
                  <p className="mt-1 text-lg font-semibold">
                    {simulationResult ? `${simulationResult.elapsedMs} ms` : "Not run yet"}
                  </p>
                  <p className={cn("mt-1 text-sm", mutedTextClass)}>
                    {simulationResult
                      ? `${Math.round(
                          simulationResult.simulations /
                            Math.max(simulationResult.elapsedMs, 1),
                        )} trials/ms`
                      : "Waiting for the first simulation"}
                  </p>
                </div>
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Comparison baseline</p>
                  <p className="mt-1 text-lg font-semibold">
                    {comparisonEntry ? "Saved run selected" : "None selected"}
                  </p>
                  <p className={cn("mt-1 text-sm", mutedTextClass)}>
                    {comparisonEntry
                      ? `${formatPercent(resultSummary.win - comparisonEntry.result.win)} win delta`
                      : "Choose a recent run to compare charts and result deltas."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={panelCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5 text-accent" />
                  Recent Runs
                </CardTitle>
                <CardDescription>
                  Save, reload, compare, and export recent simulations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {runHistory.length === 0 ? (
                  <div
                    className={cn(
                      "rounded-2xl border border-dashed p-4 text-sm",
                      mutedPanelClass,
                      mutedTextClass,
                    )}
                  >
                    No completed runs yet.
                  </div>
                ) : (
                  runHistory.map((entry) => {
                    const isSelectedForComparison = comparisonRunId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className={cn("rounded-2xl border p-4", insetPanelClass)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{entry.summary}</p>
                            <p className={cn("text-xs", softTextClass)}>
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                            <CheckCircle2 className="size-3.5" />
                            {formatPercent(entry.result.win)} win
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={outlineButtonClass}
                            onClick={() => loadHistoryEntry(entry)}
                          >
                            Load setup
                          </Button>
                          <Button
                            variant={isSelectedForComparison ? "secondary" : "outline"}
                            size="sm"
                            className={isSelectedForComparison ? "" : outlineButtonClass}
                            onClick={() =>
                              setComparisonRunId((currentId) =>
                                currentId === entry.id ? null : entry.id,
                              )
                            }
                          >
                            <GitCompareArrows className="mr-2 size-4" />
                            {isSelectedForComparison ? "Comparing" : "Compare"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className={panelCardClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-secondary" />
                Seat Overview
              </CardTitle>
              <CardDescription>
                Fixed cards and random seats can now coexist in the same simulation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Fixed seats</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {getKnownSeatCount(opponentSeats, opponentCount)}
                  </p>
                </div>
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className={cn("text-sm", mutedTextClass)}>Random seats</p>
                  <p className="mt-1 text-3xl font-semibold">{hiddenOpponentSeats}</p>
                </div>
              </div>
              <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                <p className={cn("text-sm", mutedTextClass)}>Opponent summary</p>
                <p className="mt-2 text-sm leading-6">{opponentSummary}</p>
              </div>
              <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                <p className={cn("text-sm", mutedTextClass)}>History tools</p>
                <p className="mt-2 text-sm leading-6">
                  Recent runs can be reloaded into the table, compared against the latest
                  simulation, or exported for outside analysis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelCardClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {comparisonEntry ? (
                  <GitCompareArrows className="size-5 text-accent" />
                ) : (
                  <CircleOff className="size-5 text-accent" />
                )}
                Comparison Summary
              </CardTitle>
              <CardDescription>
                Deltas appear here as soon as you select a saved run for comparison.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {comparisonEntry ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                      <p className={cn("text-sm", mutedTextClass)}>Win delta</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatPercent(resultSummary.win - comparisonEntry.result.win)}
                      </p>
                    </div>
                    <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                      <p className={cn("text-sm", mutedTextClass)}>Lose delta</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatPercent(resultSummary.lose - comparisonEntry.result.lose)}
                      </p>
                    </div>
                    <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                      <p className={cn("text-sm", mutedTextClass)}>Tie delta</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatPercent(resultSummary.tie - comparisonEntry.result.tie)}
                      </p>
                    </div>
                  </div>
                  <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                    <p className={cn("text-sm", mutedTextClass)}>Baseline run</p>
                    <p className="mt-2 text-sm leading-6">{comparisonEntry.summary}</p>
                  </div>
                </>
              ) : (
                <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Select a recent run to compare outcome rates and hand distributions
                    against the current table state.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <Card className={panelCardClass}>
            <CardHeader>
              <CardTitle>Charting</CardTitle>
              <CardDescription>
                The app now uses a dedicated charting library instead of mock visuals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsCharts result={resultSummary} comparison={comparisonEntry?.result ?? null} />
            </CardContent>
          </Card>

          <Card className={panelCardClass}>
            <CardHeader>
              <CardTitle>Hand Type Breakdown</CardTitle>
              <CardDescription>
                Full hero final-hand distribution across the latest completed trial set.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {handBreakdown.map(([label, value]) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium">{formatPercent(value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
                      style={{ width: `${Math.max(Number(value), 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
