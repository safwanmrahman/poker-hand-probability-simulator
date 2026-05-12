"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { HandBreakdownList } from "@/components/simulator/hand-breakdown-list";
import { HeroHeader } from "@/components/simulator/hero-header";
import { OverviewPanels } from "@/components/simulator/overview-panels";
import { ResultsSidebar } from "@/components/simulator/results-sidebar";
import { SetupSidebar } from "@/components/simulator/setup-sidebar";
import { SharedDeck } from "@/components/simulator/shared-deck";
import { TableBuilder } from "@/components/simulator/table-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BOARD_STREETS, DECK, SCENARIO_PRESETS } from "@/features/simulator/constants";
import {
  clampIndex,
  createDefaultOpponentSeats,
  downloadTextFile,
  formatCards,
  formatPercent,
  getCardDetails,
  getKnownSeatCount,
  getTopHandLabels,
  getUsedCards,
  normalizeSeat,
  shuffleCards,
} from "@/features/simulator/helpers";
import {
  buildPersistedState,
  loadPersistedState,
  loadThemeMode,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/simulator/storage";
import type {
  ActiveTarget,
  OpponentMode,
  OpponentSeat,
  PersistedState,
  RunHistoryEntry,
  SimulationWorkerMessage,
  ThemeMode,
} from "@/features/simulator/types";
import { buildRunHistoryCsv } from "@/lib/history";
import { HAND_LABELS, type MonteCarloResult } from "@/lib/poker";

const ResultsCharts = dynamic(
  () => import("@/components/results-charts").then((module) => module.ResultsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        {["Outcome Radar", "Run Comparison", "Hand Distribution"].map((label, index) => (
          <div
            key={label}
            className={
              index === 2
                ? "rounded-[1.75rem] border border-border bg-card/92 p-5 xl:col-span-2"
                : "rounded-[1.75rem] border border-border bg-card/92 p-5"
            }
          >
            <h3 className="text-base font-semibold">{label}</h3>
            <div className="mt-4 h-72 animate-pulse rounded-2xl bg-muted/60" />
          </div>
        ))}
      </div>
    ),
  },
);

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

    const nextState: PersistedState = buildPersistedState({
      selectedHoleCards,
      selectedBoardCards,
      activeTarget,
      opponentCount,
      opponentSeats,
      simulationInput,
      simulationResult,
      runHistory,
      comparisonRunId,
    });

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
  const fixedSeatCount = getKnownSeatCount(opponentSeats, opponentCount);
  const holeCardsSelected = selectedHoleCards.filter(Boolean).length;
  const boardCardsSelected = selectedBoardCards.filter(Boolean).length;
  const remainingDeckCount = 52 - usedCards.size;
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
  const hiddenOpponentSeats = Math.max(opponentCount - fixedSeatCount, 0);
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
      tone: "bg-[var(--color-chart-win)]",
    },
    {
      label: "Lose",
      value: formatPercent(resultSummary.lose),
      detail: isRunningSimulation ? "Updating in background" : "Any opponent beats hero",
      tone: "bg-[var(--color-chart-loss)]",
    },
    {
      label: "Tie",
      value: formatPercent(resultSummary.tie),
      detail: isRunningSimulation ? "Updating in background" : "Hero shares the pot",
      tone: "bg-[var(--color-chart-tie)]",
    },
  ];
  const handBreakdown = HAND_LABELS.map((label, index) => [
    label,
    resultSummary.handBreakdown[index],
  ] as const);
  const topHandLabels = getTopHandLabels(resultSummary.handBreakdown);
  const isDarkMode = themeMode === "dark";
  const panelCardClass = isDarkMode
    ? "border-white/10 bg-[linear-gradient(180deg,rgba(12,24,34,0.94),rgba(9,17,24,0.94))] shadow-[0_24px_58px_-40px_rgba(0,0,0,0.7)]"
    : "border-[#dfcfba] bg-[linear-gradient(180deg,rgba(255,254,251,0.98),rgba(250,245,238,0.97))] shadow-[0_16px_36px_-30px_rgba(38,23,12,0.18)]";
  const insetPanelClass = isDarkMode
    ? "border-white/10 bg-slate-950/45"
    : "border-[#dfcfba] bg-[#fcf8f2]";
  const mutedPanelClass = isDarkMode
    ? "border-white/10 bg-muted/20"
    : "border-[#e0d1be] bg-[#faf5ed]";
  const outlineButtonClass = isDarkMode
    ? "border-white/10 bg-slate-950/40 text-foreground hover:bg-slate-900"
    : "border-[#dfcfba] bg-[#fffefb] text-slate-900 hover:bg-[#f6efe4] shadow-[0_8px_16px_-16px_rgba(29,20,12,0.28)]";
  const heroRunButtonClass = isDarkMode
    ? "border-white/10 bg-white text-slate-950 hover:bg-white/90 disabled:border-white/10 disabled:bg-white disabled:text-slate-950 disabled:opacity-100"
    : "border-[#efe3d3] bg-[#fffefb] text-[#0e302a] hover:bg-[#f8f1e7] disabled:border-[#efe3d3] disabled:bg-[#fffefb] disabled:text-[#0e302a] disabled:opacity-100";
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

  function updateSeat(seatIndex: number, updater: (seat: OpponentSeat) => OpponentSeat) {
    setOpponentSeats((currentSeats) =>
      currentSeats.map((seat, index) => (index === seatIndex ? updater(seat) : seat)),
    );
  }

  function setScenarioPreset(label: string) {
    const preset = SCENARIO_PRESETS.find((entry) => entry.label === label);

    if (!preset) {
      return;
    }

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
        currentCards.map((card, index) => (index === activeTarget.slot ? cardId : card)),
      );
    }

    if (activeTarget.area === "board") {
      setSelectedBoardCards((currentCards) =>
        currentCards.map((card, index) => (index === activeTarget.slot ? cardId : card)),
      );
    }

    if (activeTarget.area === "opponent") {
      updateSeat(activeTarget.seat, (seat) => ({
        mode: "known",
        cards: seat.cards.map((card, index) => (index === activeTarget.slot ? cardId : card)),
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
      cards: [null, null],
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

    const heroHoleCards = selectedHoleCards.filter((cardId): cardId is string => cardId !== null);
    const boardCards = selectedBoardCards.filter((cardId): cardId is string => cardId !== null);
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
    <main className="mx-auto min-h-screen w-full max-w-[1620px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="grid gap-6">
        <HeroHeader
          boardStage={boardStage}
          canRunSimulation={canRunSimulation}
          fixedSeatCount={fixedSeatCount}
          heroRunButtonClass={heroRunButtonClass}
          isDarkMode={isDarkMode}
          isRunningSimulation={isRunningSimulation}
          opponentCount={opponentCount}
          outlineButtonClass={outlineButtonClass}
          parsedSimulationCount={isSimulationCountValid ? parsedSimulationCount : 0}
          scenarioSummary={scenarioSummary}
          themeMode={themeMode}
          onCancelSimulation={cancelSimulation}
          onDealRandomSetup={dealRandomSetup}
          onResetTable={resetTable}
          onRunSimulation={runSimulation}
          onToggleThemeMode={toggleThemeMode}
        />

        <section className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <SetupSidebar
            activeTargetLabel={activeTargetLabel}
            bestOutcomeLabel={bestOutcome.label}
            bestOutcomeValue={bestOutcome.value}
            boardCardsSelected={boardCardsSelected}
            canRunSimulation={canRunSimulation}
            fixedSeatCount={fixedSeatCount}
            hiddenOpponentSeats={hiddenOpponentSeats}
            holeCardsSelected={holeCardsSelected}
            insetPanelClass={insetPanelClass}
            isRunningSimulation={isRunningSimulation}
            mutedPanelClass={mutedPanelClass}
            mutedTextClass={mutedTextClass}
            onExportHistory={exportHistory}
            onExportLatestResult={exportLatestResult}
            onResetTable={resetTable}
            onRunSimulation={runSimulation}
            onSelectOpponentPreset={(value) => setOpponentCount(value)}
            onSelectScenarioPreset={setScenarioPreset}
            onSetOpponentCount={(value) => setOpponentCount(clampIndex(value || 1, 9) || 1)}
            onSetSimulationInput={setSimulationInput}
            opponentCount={opponentCount}
            outlineButtonClass={outlineButtonClass}
            panelCardClass={panelCardClass}
            remainingDeckCount={remainingDeckCount}
            runHistoryCount={runHistory.length}
            simulationError={simulationError}
            simulationInput={simulationInput}
            simulationProgress={simulationProgress}
            simulationResultElapsedMs={simulationResult?.elapsedMs ?? null}
            simulationResultPresent={Boolean(simulationResult)}
            softTextClass={softTextClass}
            statusMessage={statusMessage}
            strongTextClass={strongTextClass}
          />

          <div className="grid gap-6">
            <TableBuilder
              activeTarget={activeTarget}
              boardStage={boardStage}
              clearAllBoardCards={clearAllBoardCards}
              clearAllHoleCards={clearAllHoleCards}
              clearAllOpponentSeats={clearAllOpponentSeats}
              clearBoardSlot={clearBoardSlot}
              clearHoleSlot={clearHoleSlot}
              clearOpponentSlot={clearOpponentSlot}
              dealBoardThrough={dealBoardThrough}
              getCardDetails={getCardDetails}
              insetPanelClass={insetPanelClass}
              isDarkMode={isDarkMode}
              isRunningSimulation={isRunningSimulation}
              mutedTextClass={mutedTextClass}
              outlineButtonClass={outlineButtonClass}
              panelCardClass={panelCardClass}
              selectedBoardCards={selectedBoardCards}
              selectedHoleCards={selectedHoleCards}
              setActiveTarget={setActiveTarget}
              setOpponentSeatMode={setOpponentSeatMode}
              visibleOpponentSeats={visibleOpponentSeats}
            />
            <SharedDeck
              activeTargetLabel={activeTargetLabel}
              assignCardToTarget={assignCardToTarget}
              isDarkMode={isDarkMode}
              isRunningSimulation={isRunningSimulation}
              mutedPanelClass={mutedPanelClass}
              mutedTextClass={mutedTextClass}
              panelCardClass={panelCardClass}
              remainingDeckCount={remainingDeckCount}
              usedCards={usedCards}
            />
          </div>

          <ResultsSidebar
            bestOutcomeLabel={bestOutcome.label}
            bestOutcomeValue={bestOutcome.value}
            comparisonEntry={comparisonEntry}
            comparisonRunId={comparisonRunId}
            completedSimulations={completedSimulations}
            formatPercent={formatPercent}
            isDarkMode={isDarkMode}
            isRunningSimulation={isRunningSimulation}
            loadHistoryEntry={loadHistoryEntry}
            mutedPanelClass={insetPanelClass}
            mutedTextClass={mutedTextClass}
            outlineButtonClass={outlineButtonClass}
            outcomeStats={outcomeStats}
            panelCardClass={panelCardClass}
            parsedSimulationCount={isSimulationCountValid ? parsedSimulationCount : 0}
            runHistory={runHistory}
            setComparisonRunId={setComparisonRunId}
            simulationProgress={simulationProgress}
            simulationResult={simulationResult}
            simulationResultWin={resultSummary.win}
            strongTextClass={strongTextClass}
            topHandLabel={topHandLabels[0]?.label ?? "N/A"}
            topHandValue={topHandLabels[0] ? formatPercent(topHandLabels[0].value) : "0.0%"}
          />
        </section>

        <OverviewPanels
          comparisonEntry={comparisonEntry}
          fixedSeatCount={fixedSeatCount}
          formatPercent={formatPercent}
          hiddenOpponentSeats={hiddenOpponentSeats}
          insetPanelClass={insetPanelClass}
          mutedTextClass={mutedTextClass}
          opponentSummary={opponentSummary}
          panelCardClass={panelCardClass}
          resultSummary={resultSummary}
        />

        <section className="grid gap-6">
          <Card className={panelCardClass}>
            <CardHeader>
              <CardTitle>Charts</CardTitle>
              <CardDescription>
                Compare outcome rates and hand distributions from recent runs.
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
                Review the hero hand distribution from the latest run.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HandBreakdownList handBreakdown={handBreakdown} formatPercent={formatPercent} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
