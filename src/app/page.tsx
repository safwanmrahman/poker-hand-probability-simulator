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

const outcomeStats = [
  { label: "Win", value: "47.8%", tone: "bg-primary" },
  { label: "Lose", value: "44.1%", tone: "bg-secondary" },
  { label: "Tie", value: "8.1%", tone: "bg-accent" },
];

const handBreakdown = [
  ["High Card", 18],
  ["Pair", 41],
  ["Two Pair", 21],
  ["Trips", 7],
  ["Straight", 5],
  ["Flush", 4],
  ["Full House", 2],
  ["Quads", 1],
  ["Straight Flush", 0.6],
  ["Royal Flush", 0.1],
] as const;
const boardCards = ["Q H", "J D", "10 C", "--", "--"];

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
  const [activeHoleSlot, setActiveHoleSlot] = useState(0);

  const nextEmptySlot = selectedHoleCards.findIndex((card) => card === null);
  const usedCards = new Set(selectedHoleCards.filter(Boolean));

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
  }

  function clearAllHoleCards() {
    setSelectedHoleCards([null, null]);
    setActiveHoleSlot(0);
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
                    Hole-card selection is live now, with the board, simulation
                    controls, and probability analysis ready for the next steps.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-white text-secondary hover:bg-white/92"
                  >
                    Run Placeholder Trial
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/16"
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
              Placeholder card layout for the upcoming interactive selector.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                      onClick={() => setActiveHoleSlot(index)}
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
                <button className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Street selector
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {boardCards.map((card) => (
                  <PlayingCard key={card} value={card} />
                ))}
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
                Start by choosing two hole cards. Selected cards are disabled in
                the deck.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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
                      onClick={() => setActiveHoleSlot(index)}
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
                      onClick={() => handleHoleCardSelect(card.id)}
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

              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4">
                <p className="text-sm font-medium">Board card picker</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Flop, turn, and river selection will come in the next step.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/78">
            <CardHeader>
              <CardTitle>Simulation Controls</CardTitle>
              <CardDescription>
                Inputs are scaffolded for trial count and action flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    defaultValue="25000"
                    placeholder="25000"
                  />
                </div>
                <div className="flex items-end">
                  <Button size="lg" className="w-full sm:w-auto">
                    Simulate Hands
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">
                Monte Carlo engine and validation logic will plug into this
                control panel next.
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
                Win, lose, and tie metrics are framed as ready-to-bind stats.
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
                    Placeholder probability
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
                  Final made-hand distribution placeholder.
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
                    <span className="text-sm text-muted-foreground">
                      Chart placeholder
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-[linear-gradient(180deg,rgba(217,119,6,0.04),rgba(217,119,6,0.14))] p-4">
                  <p className="text-sm font-medium">Street-by-street trend</p>
                  <div className="mt-6 flex h-48 items-end gap-3 rounded-2xl bg-white/55 p-4">
                    {[42, 56, 50, 73, 66].map((height, index) => (
                      <div key={height} className="flex-1 space-y-2">
                        <div
                          className="rounded-t-xl bg-secondary/82"
                          style={{ height: `${height}%` }}
                        />
                        <p className="text-center text-xs text-muted-foreground">
                          {index + 1}
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
