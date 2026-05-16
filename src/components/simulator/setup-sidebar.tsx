import { Download, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LARGE_SIMULATION_WARNING_THRESHOLD,
  MAX_SIMULATIONS,
  MIN_SIMULATIONS,
  OPPONENT_PRESETS,
  SCENARIO_PRESETS,
  SIMULATION_PRESETS,
} from "@/features/simulator/constants";
import { cn } from "@/lib/utils";

type SetupSidebarProps = {
  canRunSimulation: boolean;
  hiddenOpponentSeats: number;
  isRunningSimulation: boolean;
  opponentCount: number;
  outlineButtonClass: string;
  panelCardClass: string;
  simulationError: string | null;
  simulationInput: string;
  simulationResultElapsedMs: number | null;
  simulationResultPresent: boolean;
  simulationProgress: number;
  simulationWarning: string | null;
  statusMessage: string;
  strongTextClass: string;
  mutedPanelClass: string;
  insetPanelClass: string;
  mutedTextClass: string;
  softTextClass: string;
  fixedSeatCount: number;
  remainingDeckCount: number;
  holeCardsSelected: number;
  boardCardsSelected: number;
  activeTargetLabel: string;
  bestOutcomeLabel: string;
  bestOutcomeValue: string;
  runHistoryCount: number;
  onExportHistory: () => void;
  onExportLatestResult: () => void;
  onResetTable: () => void;
  onRunSimulation: () => void;
  onSelectOpponentPreset: (value: number) => void;
  onSelectScenarioPreset: (label: string) => void;
  onSetOpponentCount: (value: number) => void;
  onSetSimulationInput: (value: string) => void;
};

export function SetupSidebar({
  activeTargetLabel,
  bestOutcomeLabel,
  bestOutcomeValue,
  boardCardsSelected,
  canRunSimulation,
  fixedSeatCount,
  hiddenOpponentSeats,
  holeCardsSelected,
  insetPanelClass,
  isRunningSimulation,
  mutedPanelClass,
  mutedTextClass,
  onExportHistory,
  onExportLatestResult,
  onResetTable,
  onRunSimulation,
  onSelectOpponentPreset,
  onSelectScenarioPreset,
  onSetOpponentCount,
  onSetSimulationInput,
  opponentCount,
  outlineButtonClass,
  panelCardClass,
  remainingDeckCount,
  runHistoryCount,
  simulationError,
  simulationInput,
  simulationProgress,
  simulationResultElapsedMs,
  simulationResultPresent,
  simulationWarning,
  statusMessage,
  strongTextClass,
  softTextClass,
}: SetupSidebarProps) {
  return (
    <div className="grid gap-6">
      <Card className={panelCardClass}>
        <CardHeader>
          <CardTitle>Setup Summary</CardTitle>
          <CardDescription>
            Build a table and confirm the current setup before running simulations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
            <p className={cn("text-sm font-medium", strongTextClass)}>Table status</p>
            <p className={cn("mt-2 text-sm leading-6", mutedTextClass)}>
              {holeCardsSelected}/2 hero cards selected, {boardCardsSelected}/5 board cards
              selected, {remainingDeckCount} cards still available.
            </p>
            <p className={cn("mt-2 text-sm leading-6", mutedTextClass)}>{statusMessage}</p>
            {simulationError ? (
              <p className="mt-2 text-sm leading-6 text-red-700 dark:text-rose-300">
                {simulationError}
              </p>
            ) : null}
            {simulationWarning ? (
              <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
                {simulationWarning}
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
                {bestOutcomeLabel} {bestOutcomeValue}
              </p>
            </div>
            <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
              <p className={cn("text-sm", mutedTextClass)}>Seat mix</p>
              <p className="mt-1 text-lg font-semibold">
                {fixedSeatCount} fixed / {hiddenOpponentSeats} random
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
                onClick={() => onSelectScenarioPreset(preset.label)}
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
            Choose trial count, opponents, and export options.
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
              min={String(MIN_SIMULATIONS)}
              max={String(MAX_SIMULATIONS)}
              step="1000"
              inputMode="numeric"
              value={simulationInput}
              onChange={(event) => onSetSimulationInput(event.target.value)}
              placeholder="25000"
              disabled={isRunningSimulation}
            />
            <p className={cn("text-xs leading-5", mutedTextClass)}>
              Run between {MIN_SIMULATIONS.toLocaleString()} and {MAX_SIMULATIONS.toLocaleString()} trials.
              Runs above {LARGE_SIMULATION_WARNING_THRESHOLD.toLocaleString()} may take longer on lower-power devices.
            </p>
            <div className="flex flex-wrap gap-2">
              {SIMULATION_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className={outlineButtonClass}
                  onClick={() => onSetSimulationInput(String(preset))}
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
              inputMode="numeric"
              value={String(opponentCount)}
              onChange={(event) => onSetOpponentCount(Number.parseInt(event.target.value || "1", 10) || 1)}
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
                  onClick={() => onSelectOpponentPreset(preset)}
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
              onClick={onRunSimulation}
              disabled={!canRunSimulation || isRunningSimulation}
            >
              <Play className="mr-2 size-4" />
              {isRunningSimulation ? "Running..." : "Run simulations"}
            </Button>
            <Button
              variant="outline"
              className={outlineButtonClass}
              onClick={onResetTable}
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
              onClick={onExportHistory}
              disabled={runHistoryCount === 0}
            >
              <Download className="mr-2 size-4" />
              Export history
            </Button>
            <Button
              variant="outline"
              className={outlineButtonClass}
              onClick={onExportLatestResult}
              disabled={!simulationResultPresent}
            >
              <Download className="mr-2 size-4" />
              Export result
            </Button>
          </div>

          <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn("text-sm font-medium", strongTextClass)}>Last status</p>
                <p className={cn("mt-1 text-sm", mutedTextClass)}>
                  {isRunningSimulation
                    ? `${simulationProgress}% in progress`
                    : simulationResultPresent
                      ? "Most recent run complete"
                      : "Awaiting first run"}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("text-lg font-semibold", strongTextClass)}>
                  {simulationResultElapsedMs ? `${simulationResultElapsedMs} ms` : "N/A"}
                </p>
                <p className={cn("text-xs", softTextClass)}>Elapsed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
