"use client";

import { useState } from "react";

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
const HAND_LABELS = [
  "High Card",
  "Pair",
  "Two Pair",
  "Trips",
  "Straight",
  "Flush",
  "Full House",
  "Quads",
  "Straight Flush",
  "Royal Flush",
] as const;

type SimulationSnapshot = {
  win: number;
  lose: number;
  tie: number;
  handBreakdown: number[];
  simulations: number;
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function generatePlaceholderResults(
  holeCards: (string | null)[],
  boardCards: (string | null)[],
  simulationCount: number,
): SimulationSnapshot {
  const seedSource = [...holeCards, ...boardCards].filter(Boolean).join("-");
  let seed = simulationCount;

  for (const char of seedSource) {
    seed += char.charCodeAt(0) * 17;
  }

  const win = 32 + (seed % 29);
  const tie = 2 + (Math.floor(seed / 7) % 10);
  const lose = 100 - win - tie;

  const rawBreakdown = HAND_LABELS.map((_, index) => {
    if (index === HAND_LABELS.length - 1) {
      return (seed % 3) + 1;
    }

    return ((seed + index * 19) % 100) + 12;
  });

  const rawTotal = rawBreakdown.reduce((sum, value) => sum + value, 0);
  const handBreakdown = rawBreakdown.map((value, index) => {
    if (index === rawBreakdown.length - 1) {
      const runningTotal = rawBreakdown
        .slice(0, -1)
        .reduce((sum, item) => sum + (item / rawTotal) * 100, 0);

      return Number(Math.max(0.1, 100 - runningTotal).toFixed(1));
    }

    return Number(((value / rawTotal) * 100).toFixed(1));
  });

  return {
    win,
    lose,
    tie,
    handBreakdown,
    simulations: simulationCount,
  };
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
  const [selectedHoleCards, setSelectedHoleCards] = useState<(string | null)[]>([
    null,
    null,
  ]);
  const [selectedBoardCards, setSelectedBoardCards] = useState<(string | null)[]>(
    [null, null, null, null, null],
  );
  const [activeHoleSlot, setActiveHoleSlot] = useState(0);
  const [activeBoardSlot, setActiveBoardSlot] = useState(0);
  const [activePicker, setActivePicker] = useState<"hole" | "board">("hole");
  const [simulationInput, setSimulationInput] = useState("25000");
  const [simulationResult, setSimulationResult] = useState<SimulationSnapshot | null>(
    null,
  );

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
  const canRunPlaceholder =
    holeCardsSelected === 2 && !hasBoardGap && isSimulationCountValid;
  const activeTargetLabel =
    activePicker === "hole"
      ? `Hole card slot ${activeHoleSlot + 1}`
      : BOARD_STREETS[activeBoardSlot];
  const statusMessage =
    holeCardsSelected < 2
      ? "Choose both hole cards to unlock placeholder simulation runs."
      : hasBoardGap
        ? "Fill community cards from left to right so the board state stays valid."
        : !isSimulationCountValid
          ? "Enter a simulation count between 1,000 and 500,000."
          : "Selections look valid. You can run a placeholder simulation now.";
  const resultSummary =
    simulationResult ??
    generatePlaceholderResults(
      selectedHoleCards,
      selectedBoardCards,
      isSimulationCountValid ? parsedSimulationCount : 25000,
    );
  const outcomeStats = [
    { label: "Win", value: formatPercent(resultSummary.win), tone: "bg-primary" },
    { label: "Lose", value: formatPercent(resultSummary.lose), tone: "bg-secondary" },
    { label: "Tie", value: formatPercent(resultSummary.tie), tone: "bg-accent" },
  ];
  const handBreakdown = HAND_LABELS.map((label, index) => [
    label,
    resultSummary.handBreakdown[index],
  ] as const);

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
  }

  function runPlaceholderSimulation() {
    if (!canRunPlaceholder) {
      return;
    }

    setSimulationResult(
      generatePlaceholderResults(
        selectedHoleCards,
        selectedBoardCards,
        parsedSimulationCount,
      ),
    );
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
                    disabled={!canRunPlaceholder}
                  >
                    Run Placeholder Trial
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                    onClick={() => setActivePicker("board")}
                  >
                    Configure Board
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
                    <p className="mt-1 text-2xl font-semibold">25,000</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {simulationResult
                    ? `Placeholder run complete for ${simulationResult.simulations.toLocaleString()} trials.`
                    : "Run the placeholder engine to push current selections into the results panels below."}
                </p>
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
                placeholder simulation state.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">
                  Active picker: <span className="text-primary">{activeTargetLabel}</span>
                </p>
                <p className="text-muted-foreground">
                  Selected cards are removed from the available deck.
                </p>
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
                <Button variant="outline" onClick={clearAllBoardCards}>
                  Clear board
                </Button>
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
                Controls are live now, with validation and quick presets.
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
                    disabled={!canRunPlaceholder}
                  >
                    Simulate Hands
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
                    {boardCardsSelected === 0
                      ? "Preflop"
                      : boardCardsSelected <= 3
                        ? "Flop"
                        : boardCardsSelected === 4
                          ? "Turn"
                          : "River"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/45 p-4 text-sm">
                  <p className="font-medium">Run Readiness</p>
                  <p className="mt-1 text-muted-foreground">
                    {canRunPlaceholder ? "Ready" : "Needs input"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">
                Placeholder simulation mode is active. Real Monte Carlo logic
                will replace these generated values in a later commit.
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
                Results now react to the current setup or the latest placeholder run.
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
                    {simulationResult ? "Latest placeholder run" : "Live preview"}
                  </p>
                </div>
              ))}
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
                  Placeholder final-hand distribution based on current state.
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
                  Reserved for richer visualizations once simulation data is
                  wired in.
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
