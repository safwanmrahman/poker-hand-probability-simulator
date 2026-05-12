import { CircleOff, GitCompareArrows, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunHistoryEntry } from "@/features/simulator/types";
import { cn } from "@/lib/utils";

type OverviewPanelsProps = {
  comparisonEntry: RunHistoryEntry | null;
  hiddenOpponentSeats: number;
  insetPanelClass: string;
  mutedTextClass: string;
  opponentSummary: string;
  panelCardClass: string;
  resultSummary: { win: number; lose: number; tie: number };
  fixedSeatCount: number;
  formatPercent: (value: number) => string;
};

export function OverviewPanels({
  comparisonEntry,
  fixedSeatCount,
  formatPercent,
  hiddenOpponentSeats,
  insetPanelClass,
  mutedTextClass,
  opponentSummary,
  panelCardClass,
  resultSummary,
}: OverviewPanelsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className={panelCardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-secondary" />
            Seat Overview
          </CardTitle>
          <CardDescription>
            Review fixed and random opponent seats in the current table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn("rounded-2xl border p-4", insetPanelClass)}>
              <p className={cn("text-sm", mutedTextClass)}>Fixed seats</p>
              <p className="mt-1 text-3xl font-semibold">{fixedSeatCount}</p>
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
              Reload saved runs, compare outcomes, or export results.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={panelCardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {comparisonEntry ? (
              <GitCompareArrows className="size-5 text-[var(--color-chart-tie)]" />
            ) : (
              <CircleOff className="size-5 text-[var(--color-chart-tie)]" />
            )}
            Comparison Summary
          </CardTitle>
          <CardDescription>
            Compare the current run against a selected baseline.
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
  );
}
