"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowRight,
  BarChart3,
  ChartColumnIncreasing,
  ChevronDown,
  Dices,
  TrendingUp,
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
import {
  createMonteCarloAccumulator,
  finalizeMonteCarloResult,
  HAND_LABELS,
  runMonteCarloBatch,
  type MonteCarloAccumulator,
  type MonteCarloResult,
} from "@/lib/poker";

const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = [
  { code: "S", symbol: "♠", tone: "text-foreground" },
  { code: "H", symbol: "♥", tone: "text-red-600" },
  { code: "D", symbol: "♦", tone: "text-red-600" },
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
    activePicker: "board" as const,
    activeBoardSlot: 0,
  },
  {
    label: "Big Slick Draw",
    holeCards: ["AS", "KS"],
    boardCards: ["QS", "JD", "2S", null, null],
    activePicker: "board" as const,
    activeBoardSlot: 3,
  },
  {
    label: "Set on Flop",
    holeCards: ["9C", "9D"],
    boardCards: ["9H", "KS", "2D", null, null],
    activePicker: "board" as const,
    activeBoardSlot: 3,
  },
] as const;
type PersistedState = {
  selectedHoleCards: (string | null)[];
  selectedBoardCards: (string | null)[];
  activeHoleSlot: number;
  activeBoardSlot: number;
  activePicker: "hole" | "board";
  opponentCount: number;
  simulationInput: string;
  simulationResult: MonteCarloResult | null;
};

const STORAGE_KEY = "poker-simulator-ui-state";
const SIMULATION_BATCH_SIZE = 2500;

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

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedState = window.localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    return null;
  }

  try {
    return JSON.parse(storedState) as PersistedState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function PlayingCard({
  value,
  highlighted = false,
  accent,
}: {
  value: string;
  highlighted?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={[
        "flex h-24 w-17 flex-col justify-between rounded-2xl border p-3 shadow-sm transition-transform sm:h-28 sm:w-20",
        highlighted
          ? "border-primary/25 bg-white text-secondary"
          : "border-border bg-[#fffdf8] text-foreground/75",
      ].join(" ")}
    >
      <span className={`text-sm font-semibold tracking-[0.2em] ${accent ?? ""}`}>
        {value}
      </span>
      <span className="self-end text-xs uppercase text-muted-foreground">
        card
      </span>
    </div>
  );
}

export default function Home() {
  const persistedState = loadPersistedState();
  const [selectedHoleCards, setSelectedHoleCards] = useState<(string | null)[]>(
    () => [
      persistedState?.selectedHoleCards?.[0] ?? null,
      persistedState?.selectedHoleCards?.[1] ?? null,
    ],
  );
  const [selectedBoardCards, setSelectedBoardCards] = useState<(string | null)[]>(
    () => [
      persistedState?.selectedBoardCards?.[0] ?? null,
      persistedState?.selectedBoardCards?.[1] ?? null,
      persistedState?.selectedBoardCards?.[2] ?? null,
      persistedState?.selectedBoardCards?.[3] ?? null,
      persistedState?.selectedBoardCards?.[4] ?? null,
    ],
  );
  const [activeHoleSlot, setActiveHoleSlot] = useState(() =>
    clampIndex(persistedState?.activeHoleSlot ?? 0, 1),
  );
  const [activeBoardSlot, setActiveBoardSlot] = useState(() =>
    clampIndex(persistedState?.activeBoardSlot ?? 0, 4),
  );
  const [activePicker, setActivePicker] = useState<"hole" | "board">(
    persistedState?.activePicker === "board" ? "board" : "hole",
  );
  const [opponentCount, setOpponentCount] = useState(
    clampIndex(persistedState?.opponentCount ?? 1, 9) || 1,
  );
  const [simulationInput, setSimulationInput] = useState(
    persistedState?.simulationInput ?? "25000",
  );
  const [simulationResult, setSimulationResult] = useState<MonteCarloResult | null>(
    persistedState?.simulationResult ?? null,
  );
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [completedSimulations, setCompletedSimulations] = useState(0);
  const simulationRunIdRef = useRef(0);

  useEffect(() => {
    const persistedState: PersistedState = {
      selectedHoleCards,
      selectedBoardCards,
      activeHoleSlot,
      activeBoardSlot,
      activePicker,
      opponentCount,
      simulationInput,
      simulationResult,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  }, [
    activeBoardSlot,
    activeHoleSlot,
    activePicker,
    opponentCount,
    selectedBoardCards,
    selectedHoleCards,
    simulationInput,
    simulationResult,
  ]);

  const nextEmptySlot = selectedHoleCards.findIndex((card) => card === null);
  const nextEmptyBoardSlot = selectedBoardCards.findIndex((card) => card === null);
  const usedCards = new Set(
    [...selectedHoleCards, ...selectedBoardCards].filter(Boolean),
  );
  const holeCardsSelected = selectedHoleCards.filter(Boolean).length;
  const boardCardsSelected = selectedBoardCards.filter(Boolean).length;
  const remainingDeckCount = DECK.length - usedCards.size;
  const hasBoardGap = selectedBoardCards.some(
    (card, index) => card === null && selectedBoardCards.slice(index + 1).some(Boolean),
  );
  const parsedSimulationCount = Number.parseInt(simulationInput, 10);
  const isSimulationCountValid =
    Number.isFinite(parsedSimulationCount) &&
    parsedSimulationCount >= 1000 &&
    parsedSimulationCount <= 500000;
  const isOpponentCountValid = opponentCount >= 1 && opponentCount <= 9;
  const canRunSimulation =
    holeCardsSelected === 2 &&
    !hasBoardGap &&
    isSimulationCountValid &&
    isOpponentCountValid;
  const activeTargetLabel =
    activePicker === "hole"
      ? `Hole card slot ${activeHoleSlot + 1}`
      : BOARD_STREETS[activeBoardSlot];
  const boardStage =
    boardCardsSelected === 0
      ? "Preflop"
      : boardCardsSelected <= 3
        ? "Flop"
        : boardCardsSelected === 4
          ? "Turn"
          : "River";
  const scenarioSummary = [
    selectedHoleCards.filter(Boolean).join(" ") || "No hole cards",
    selectedBoardCards.filter(Boolean).join(" ") || "No board cards",
    `vs ${opponentCount} opponent${opponentCount === 1 ? "" : "s"}`,
    boardStage,
  ].join(" • ");
  const statusMessage =
    holeCardsSelected < 2
      ? "Choose both hole cards to unlock placeholder simulation runs."
      : hasBoardGap
        ? "Fill community cards from left to right so the board state stays valid."
        : !isOpponentCountValid
          ? "Choose between 1 and 9 opponents."
        : !isSimulationCountValid
          ? "Enter a simulation count between 1,000 and 500,000."
          : "Selections look valid. You can run the simulation now.";
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
    { label: "Win", value: formatPercent(resultSummary.win), tone: "bg-primary" },
    { label: "Lose", value: formatPercent(resultSummary.lose), tone: "bg-secondary" },
    { label: "Tie", value: formatPercent(resultSummary.tie), tone: "bg-accent" },
  ];
  const handBreakdown = HAND_LABELS.map((label, index) => [
    label,
    resultSummary.handBreakdown[index],
  ] as const);

  function setScenarioPreset(preset: (typeof SCENARIO_PRESETS)[number]) {
    setSelectedHoleCards([...preset.holeCards]);
    setSelectedBoardCards([...preset.boardCards]);
    setActiveHoleSlot(0);
    setActiveBoardSlot(preset.activeBoardSlot);
    setActivePicker(preset.activePicker);
    setSimulationResult(null);
  }

  function handleHoleCardSelect(cardId: string) {
    const shouldAdvanceSlot =
      selectedHoleCards[activeHoleSlot] === null && nextEmptySlot !== -1;

    setSelectedHoleCards((currentCards) => {
      if (currentCards.includes(cardId)) {
        return currentCards;
      }

      const updatedCards = [...currentCards];
      const targetSlot =
        currentCards[activeHoleSlot] === null
          ? activeHoleSlot
          : currentCards.findIndex((card) => card === null);

      if (targetSlot === -1) {
        updatedCards[activeHoleSlot] = cardId;
        return updatedCards;
      }

      updatedCards[targetSlot] = cardId;
      return updatedCards;
    });

    setActiveHoleSlot((currentSlot) => {
      if (shouldAdvanceSlot) {
        return currentSlot === 0 ? 1 : 0;
      }

      return currentSlot;
    });
  }

  function clearHoleSlot(slotIndex: number) {
    setSelectedHoleCards((currentCards) =>
      currentCards.map((card, index) => (index === slotIndex ? null : card)),
    );
    setActiveHoleSlot(slotIndex);
    setActivePicker("hole");
  }

  function clearAllHoleCards() {
    setSelectedHoleCards([null, null]);
    setActiveHoleSlot(0);
    setActivePicker("hole");
    setSimulationResult(null);
  }

  function handleBoardCardSelect(cardId: string) {
    const shouldAdvanceSlot =
      selectedBoardCards[activeBoardSlot] === null && nextEmptyBoardSlot !== -1;

    setSelectedBoardCards((currentCards) => {
      if (currentCards.includes(cardId)) {
        return currentCards;
      }

      const updatedCards = [...currentCards];
      const targetSlot =
        currentCards[activeBoardSlot] === null
          ? activeBoardSlot
          : currentCards.findIndex((card) => card === null);

      if (targetSlot === -1) {
        updatedCards[activeBoardSlot] = cardId;
        return updatedCards;
      }

      updatedCards[targetSlot] = cardId;
      return updatedCards;
    });

    setActiveBoardSlot((currentSlot) => {
      if (shouldAdvanceSlot) {
        return Math.min(currentSlot + 1, 4);
      }

      return currentSlot;
    });
  }

  function clearBoardSlot(slotIndex: number) {
    setSelectedBoardCards((currentCards) =>
      currentCards.map((card, index) => (index === slotIndex ? null : card)),
    );
    setActiveBoardSlot(slotIndex);
    setActivePicker("board");
  }

  function clearAllBoardCards() {
    setSelectedBoardCards([null, null, null, null, null]);
    setActiveBoardSlot(0);
    setActivePicker("board");
    setSimulationResult(null);
  }

  function resetTable() {
    setSelectedHoleCards([null, null]);
    setSelectedBoardCards([null, null, null, null, null]);
    setActiveHoleSlot(0);
    setActiveBoardSlot(0);
    setActivePicker("hole");
    setOpponentCount(1);
    setSimulationInput("25000");
    setSimulationResult(null);
  }

  function dealRandomSetup() {
    const shuffledDeck = shuffleCards(DECK.map((card) => card.id));

    setSelectedHoleCards(shuffledDeck.slice(0, 2));
    setSelectedBoardCards(shuffledDeck.slice(2, 7));
    setActiveHoleSlot(0);
    setActiveBoardSlot(4);
    setActivePicker("board");
    setSimulationResult(null);
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
    setActiveBoardSlot(clampIndex(targetCount - 1, 4));
    setActivePicker("board");
    setSimulationResult(null);
  }

  function runPlaceholderSimulation() {
    if (!canRunSimulation || isRunningSimulation) {
      return;
    }

    const runId = simulationRunIdRef.current + 1;
    simulationRunIdRef.current = runId;
    setIsRunningSimulation(true);
    setSimulationProgress(0);
    setCompletedSimulations(0);
    setSimulationResult(null);

    const heroHoleCards = selectedHoleCards.filter(
      (cardId): cardId is string => cardId !== null,
    );
    const boardCards = selectedBoardCards.filter(
      (cardId): cardId is string => cardId !== null,
    );
    const startedAt = performance.now();
    const accumulator: MonteCarloAccumulator = createMonteCarloAccumulator();

    const runNextBatch = (completedTrials: number) => {
      if (simulationRunIdRef.current !== runId) {
        return;
      }

      const remainingTrials = parsedSimulationCount - completedTrials;
      const batchSize = Math.min(SIMULATION_BATCH_SIZE, remainingTrials);

      if (batchSize <= 0) {
        const result = finalizeMonteCarloResult({
          accumulator,
          simulations: parsedSimulationCount,
          opponents: opponentCount,
          elapsedMs: Math.round(performance.now() - startedAt),
        });

        setSimulationResult(result);
        setSimulationProgress(100);
        setCompletedSimulations(parsedSimulationCount);
        setIsRunningSimulation(false);
        return;
      }

      window.setTimeout(() => {
        runMonteCarloBatch({
          heroHoleCards,
          boardCards,
          simulations: batchSize,
          opponents: opponentCount,
          accumulator,
        });

        const nextCompletedTrials = completedTrials + batchSize;

        if (simulationRunIdRef.current !== runId) {
          return;
        }

        setCompletedSimulations(nextCompletedTrials);
        setSimulationProgress(
          Math.round((nextCompletedTrials / parsedSimulationCount) * 100),
        );

        runNextBatch(nextCompletedTrials);
      }, 0);
    };

    runNextBatch(0);
  }

  function cancelSimulation() {
    simulationRunIdRef.current += 1;
    setIsRunningSimulation(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,rgba(15,118,110,0.94),rgba(22,48,43,0.96))] text-white">
          <CardContent className="p-0">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] uppercase">
                  Texas Hold&apos;em Monte Carlo
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Build, test, and visualize poker odds from any board state.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-white/76 sm:text-lg">
                    Card selection, simulation controls, and a placeholder
                    results flow are all wired together for the next build step.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-white text-secondary hover:bg-white/92"
                    onClick={runPlaceholderSimulation}
                    disabled={!canRunSimulation || isRunningSimulation}
                  >
                    {isRunningSimulation ? "Running Simulation..." : "Run Simulation"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  {isRunningSimulation ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                      onClick={cancelSimulation}
                    >
                      Cancel Run
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                    onClick={dealRandomSetup}
                  >
                    Deal Random Table
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/14 bg-black/14 p-4 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3">
                  {outcomeStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-white/10 p-4 shadow-inner shadow-black/8"
                    >
                      <div
                        className={`mb-3 h-2 rounded-full ${stat.tone}`}
                      />
                      <p className="text-sm text-white/70">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Simulations</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {resultSummary.simulations.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Opponents</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {resultSummary.opponents}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {isRunningSimulation
                    ? `Monte Carlo simulation is running: ${completedSimulations.toLocaleString()} of ${parsedSimulationCount.toLocaleString()} trials complete.`
                    : simulationResult
                      ? `Simulation complete for ${simulationResult.simulations.toLocaleString()} trials against ${simulationResult.opponents} opponent${simulationResult.opponents === 1 ? "" : "s"} in ${simulationResult.elapsedMs} ms.`
                      : "Run a simulation to generate real win, lose, tie, and hand-distribution results."}
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#d97706,#f6c36b)] transition-[width] duration-200"
                    style={{ width: `${simulationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/72">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dices className="size-5 text-primary" />
              Table Snapshot
            </CardTitle>
            <CardDescription>
              Hole cards and community cards reflect your active selections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border bg-[#fffdf8] px-4 py-3">
              <p className="text-sm font-medium">Selection Status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {holeCardsSelected}/2 hole cards, {boardCardsSelected}/5 board cards,{" "}
                {remainingDeckCount} cards remaining in deck.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {statusMessage}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {scenarioSummary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={dealRandomSetup}>
                  Random setup
                </Button>
                <Button variant="outline" size="sm" onClick={resetTable}>
                  Reset table
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Hole Cards</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Player 1
                </p>
              </div>
              <div className="flex gap-3">
                {selectedHoleCards.map((cardId, index) => {
                  const card = DECK.find((deckCard) => deckCard.id === cardId);
                  const displayValue = card ? `${card.rank} ${card.symbol}` : "Empty";

                  return (
                    <button
                      key={`hole-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveHoleSlot(index);
                        setActivePicker("hole");
                      }}
                      className={`rounded-[1.1rem] transition-transform hover:-translate-y-0.5 ${
                        activeHoleSlot === index ? "ring-2 ring-primary/35 ring-offset-2 ring-offset-transparent" : ""
                      }`}
                    >
                      <PlayingCard
                        value={displayValue}
                        highlighted={Boolean(card)}
                        accent={card?.tone}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Community Board</p>
                <p className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Street-aware
                  <ChevronDown className="size-3.5" />
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedBoardCards.map((cardId, index) => {
                  const card = DECK.find((deckCard) => deckCard.id === cardId);
                  const displayValue = card ? `${card.rank} ${card.symbol}` : "Empty";

                  return (
                    <button
                      key={`board-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveBoardSlot(index);
                        setActivePicker("board");
                      }}
                      className={`rounded-[1.1rem] transition-transform hover:-translate-y-0.5 ${
                        activeBoardSlot === index ? "ring-2 ring-accent/35 ring-offset-2 ring-offset-transparent" : ""
                      }`}
                    >
                      <PlayingCard
                        value={displayValue}
                        highlighted={Boolean(card)}
                        accent={card?.tone}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-6">
          <Card className="bg-white/78">
            <CardHeader>
              <CardTitle>Card Selector</CardTitle>
              <CardDescription>
                The shared deck now feeds hole cards, board cards, and the
                live simulation state.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">
                  Active picker: <span className="text-primary">{activeTargetLabel}</span>
                </p>
                <p className="text-muted-foreground">
                  Selected cards are removed from the available deck and saved locally.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-[#fffdf8] p-4">
                {SCENARIO_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setScenarioPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Hole card picker</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Click a slot, then choose a card from the deck.
                  </p>
                </div>
                <Button variant="outline" onClick={clearAllHoleCards}>
                  Clear hole cards
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedHoleCards.map((cardId, index) => {
                  const card = DECK.find((deckCard) => deckCard.id === cardId);

                  return (
                    <button
                      key={`selector-slot-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveHoleSlot(index);
                        setActivePicker("hole");
                      }}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        activeHoleSlot === index
                          ? "border-primary bg-primary/6"
                          : "border-border bg-muted/20 hover:bg-muted/35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Slot {index + 1}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {card ? card.label : "Choose a card"}
                          </p>
                        </div>
                        {cardId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearHoleSlot(index);
                            }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {DECK.map((card) => {
                  const isUsed = usedCards.has(card.id);

                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={isUsed}
                      onClick={() =>
                        activePicker === "hole"
                          ? handleHoleCardSelect(card.id)
                          : handleBoardCardSelect(card.id)
                      }
                      className={`rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-colors ${
                        isUsed
                          ? "cursor-not-allowed border-border bg-muted/45 text-muted-foreground line-through opacity-65"
                          : "border-border bg-white hover:border-primary/40 hover:bg-primary/6"
                      }`}
                    >
                      <span className={card.tone}>{card.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Board card picker</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Choose flop, turn, and river cards from the same deck.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={clearAllBoardCards}>
                    Clear board
                  </Button>
                  {STREET_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => dealBoardThrough(preset.count)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {selectedBoardCards.map((cardId, index) => {
                  const card = DECK.find((deckCard) => deckCard.id === cardId);

                  return (
                    <button
                      key={`board-slot-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveBoardSlot(index);
                        setActivePicker("board");
                      }}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        activeBoardSlot === index
                          ? "border-accent bg-accent/8"
                          : "border-border bg-muted/20 hover:bg-muted/35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{BOARD_STREETS[index]}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {card ? card.label : "Choose a card"}
                          </p>
                        </div>
                        {cardId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearBoardSlot(index);
                            }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/78">
            <CardHeader>
              <CardTitle>Simulation Controls</CardTitle>
              <CardDescription>
                Controls are live now, with validation, opponent count, and quick presets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SIMULATION_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setSimulationInput(String(preset))}
                  >
                    {preset.toLocaleString()}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {OPPONENT_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setOpponentCount(preset)}
                  >
                    {preset} opponent{preset === 1 ? "" : "s"}
                  </Button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <label
                    htmlFor="simulations"
                    className="text-sm font-medium text-foreground"
                  >
                    Number of simulations
                  </label>
                  <Input
                    id="simulations"
                    type="number"
                    value={simulationInput}
                    onChange={(event) => setSimulationInput(event.target.value)}
                    placeholder="25000"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={runPlaceholderSimulation}
                    disabled={!canRunSimulation || isRunningSimulation}
                  >
                    {isRunningSimulation ? "Simulating..." : "Simulate Hands"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                <div className="space-y-2">
                  <label
                    htmlFor="opponents"
                    className="text-sm font-medium text-foreground"
                  >
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
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setOpponentCount((current) => Math.max(1, current - 1))}
                  >
                    Fewer
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setOpponentCount((current) => Math.min(9, current + 1))}
                  >
                    More
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                  <p className="font-medium">Trials</p>
                  <p className="mt-1 text-muted-foreground">
                    {isSimulationCountValid
                      ? parsedSimulationCount.toLocaleString()
                      : "Invalid count"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                  <p className="font-medium">Board Street</p>
                  <p className="mt-1 text-muted-foreground">
                    {boardStage}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                  <p className="font-medium">Opponent Count</p>
                  <p className="mt-1 text-muted-foreground">
                    {opponentCount}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                <p className="font-medium">Run Readiness</p>
                <p className="mt-1 text-muted-foreground">
                  {canRunSimulation ? "Ready to simulate" : "Needs input"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                <p className="font-medium">Progress</p>
                <p className="mt-1 text-muted-foreground">
                  {isRunningSimulation
                    ? `${simulationProgress}% complete`
                    : simulationResult
                      ? "Last run finished"
                      : "No run yet"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-[#fffdf8] p-4 text-sm leading-6 text-muted-foreground">
                Current setup is saved automatically in your browser, including the
                latest simulation snapshot.
              </div>
              <div className="rounded-2xl bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">
                Results now come from an in-browser Monte Carlo simulation using your
                current cards, board state, and opponent count. Runs are chunked to
                keep the UI responsive during larger trials.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/78">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                Results Overview
              </CardTitle>
              <CardDescription>
                Results now react to the current setup, board stage, and opponent count.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {outcomeStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-[#fffdf8] p-5"
                >
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isRunningSimulation
                      ? "Updating live"
                      : simulationResult
                        ? "Latest simulation"
                        : "Awaiting run"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/78">
            <CardHeader>
              <CardTitle>Scenario Summary</CardTitle>
              <CardDescription>
                Quick readout of the current setup and latest simulation context.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-[#fffdf8] p-5">
                <p className="text-sm text-muted-foreground">Spot</p>
                <p className="mt-2 text-lg font-semibold">{boardStage}</p>
                <p className="mt-2 text-sm text-muted-foreground">{scenarioSummary}</p>
              </div>
              <div className="rounded-2xl border border-border bg-[#fffdf8] p-5">
                <p className="text-sm text-muted-foreground">Focus</p>
                <p className="mt-2 text-lg font-semibold">
                  {activePicker === "hole" ? "Hole cards" : "Community board"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Editing {activeTargetLabel.toLowerCase()} with {remainingDeckCount} live
                  cards left in the deck.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="bg-white/78">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-accent" />
                  Hand Type Breakdown
                </CardTitle>
                <CardDescription>
                  Hero final-hand distribution across completed simulation trials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {handBreakdown.map(([label, value]) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{value}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
                        style={{ width: `${Math.max(Number(value), 1)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/78">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartColumnIncreasing className="size-5 text-secondary" />
                  Charts
                </CardTitle>
                <CardDescription>
                  Visual summaries generated from the latest simulation run.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-border bg-[linear-gradient(180deg,rgba(15,118,110,0.05),rgba(15,118,110,0.18))] p-4">
                  <p className="text-sm font-medium">Outcome donut chart</p>
                  <div className="mt-6 flex aspect-square items-center justify-center rounded-full border-12 border-primary/18 border-t-primary bg-white/50">
                    <div className="text-center">
                      <p className="text-3xl font-semibold">{formatPercent(resultSummary.win)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Win rate</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-[linear-gradient(180deg,rgba(217,119,6,0.04),rgba(217,119,6,0.14))] p-4">
                  <p className="text-sm font-medium">Street-by-street trend</p>
                  <div className="mt-6 flex h-48 items-end gap-3 rounded-2xl bg-white/55 p-4">
                    {[
                      Math.max(18, Math.round(resultSummary.tie * 4)),
                      Math.max(24, Math.round(resultSummary.lose)),
                      Math.max(30, Math.round(resultSummary.win)),
                      Math.max(36, Math.round(resultSummary.win + resultSummary.tie / 2)),
                      Math.max(42, Math.round(resultSummary.win + boardCardsSelected * 4)),
                    ].map((height, index) => (
                      <div key={height} className="flex-1 space-y-2">
                        <div
                          className="rounded-t-xl bg-secondary/82"
                          style={{ height: `${height}%` }}
                        />
                        <p className="text-center text-xs text-muted-foreground">
                          {["P", "F", "F", "T", "R"][index]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
