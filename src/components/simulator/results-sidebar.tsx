import { ShieldCheck, TrendingUp } from "lucide-react";

import { RecentRunsPanel } from "@/components/simulator/recent-runs-panel";
import { StatCard } from "@/components/simulator/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { RunHistoryEntry } from "@/features/simulator/types";
import { cn } from "@/lib/utils";

type OutcomeStat = {
  label: string;
  value: string;
  detail: string;
  tone: string;
};

type ResultsSidebarProps = {
  bestOutcomeLabel: string;
  bestOutcomeValue: string;
  comparisonEntry: RunHistoryEntry | null;
  comparisonRunId: string | null;
  completedSimulations: number;
  isDarkMode: boolean;
  isRunningSimulation: boolean;
  mutedPanelClass: string;
  mutedTextClass: string;
  outlineButtonClass: string;
  outcomeStats: OutcomeStat[];
  panelCardClass: string;
  parsedSimulationCount: number;
  runHistory: RunHistoryEntry[];
  setComparisonRunId: (value: string | null | ((currentId: string | null) => string | null)) => void;
  simulationProgress: number;
  simulationResult: { elapsedMs: number; simulations: number } | null;
  simulationResultWin: number;
  strongTextClass: string;
  topHandLabel: string;
  topHandValue: string;
  loadHistoryEntry: (entry: RunHistoryEntry) => void;
  formatPercent: (value: number) => string;
};

export function ResultsSidebar({
  bestOutcomeLabel,
  bestOutcomeValue,
  comparisonEntry,
  comparisonRunId,
  completedSimulations,
  formatPercent,
  isDarkMode,
  isRunningSimulation,
  loadHistoryEntry,
  mutedPanelClass,
  mutedTextClass,
  outlineButtonClass,
  outcomeStats,
  panelCardClass,
  parsedSimulationCount,
  runHistory,
  setComparisonRunId,
  simulationProgress,
  simulationResult,
  simulationResultWin,
  strongTextClass,
  topHandLabel,
  topHandValue,
}: ResultsSidebarProps) {
  return (
    <div className="grid content-start gap-5">
      <Card className={panelCardClass}>
        <CardHeader className="pb-4">
          <CardTitle>
            <SectionTitle icon={TrendingUp} iconClassName="text-primary">
              Results
            </SectionTitle>
          </CardTitle>
          <CardDescription>
            View odds, run progress, and saved comparisons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
                      ? "Latest run"
                      : "Awaiting run"
                }
                tone={stat.tone}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
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
                <p className={cn("text-xs", mutedTextClass)}>
                  {isRunningSimulation ? "In progress" : "Last known"}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-chart-win),var(--color-chart-tie))] transition-[width] duration-200"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={panelCardClass}>
        <CardHeader className="pb-4">
          <CardTitle>
            <SectionTitle icon={ShieldCheck} iconClassName="text-primary">
              Result Details
            </SectionTitle>
          </CardTitle>
          <CardDescription>
            View hand outcomes, speed, and comparison deltas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2.5">
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
            <p className={cn("text-sm", mutedTextClass)}>Best outcome</p>
            <p className="mt-1 text-lg font-semibold">
              {bestOutcomeLabel} {bestOutcomeValue}
            </p>
          </div>
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
            <p className={cn("text-sm", mutedTextClass)}>Most frequent made hand</p>
            <p className="mt-1 text-lg font-semibold">{topHandLabel}</p>
            <p className={cn("mt-1 text-sm", mutedTextClass)}>{topHandValue}</p>
          </div>
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
            <p className={cn("text-sm", mutedTextClass)}>Run speed</p>
            <p className="mt-1 text-lg font-semibold">
              {simulationResult ? `${simulationResult.elapsedMs} ms` : "Not run yet"}
            </p>
            <p className={cn("mt-1 text-sm", mutedTextClass)}>
              {simulationResult
                ? `${Math.round(
                    simulationResult.simulations / Math.max(simulationResult.elapsedMs, 1),
                  )} trials/ms`
                : "Waiting for the first simulation"}
            </p>
          </div>
          <div className={cn("rounded-2xl border p-4", mutedPanelClass)}>
            <p className={cn("text-sm", mutedTextClass)}>Comparison baseline</p>
            <p className="mt-1 text-lg font-semibold">
              {comparisonEntry ? "Saved run selected" : "None selected"}
            </p>
            <p className={cn("mt-1 text-sm", mutedTextClass)}>
              {comparisonEntry
                ? `${formatPercent(simulationResultWin - comparisonEntry.result.win)} win delta`
                : "Choose a recent run to compare charts and result deltas."}
            </p>
          </div>
        </CardContent>
      </Card>

      <RecentRunsPanel
        comparisonRunId={comparisonRunId}
        formatPercent={formatPercent}
        loadHistoryEntry={loadHistoryEntry}
        mutedPanelClass={mutedPanelClass}
        mutedTextClass={mutedTextClass}
        outlineButtonClass={outlineButtonClass}
        panelCardClass={panelCardClass}
        runHistory={runHistory}
        setComparisonRunId={setComparisonRunId}
      />
    </div>
  );
}
