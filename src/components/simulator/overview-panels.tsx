import { CircleOff, GitCompareArrows, Users } from "lucide-react";

import { SectionTitle } from "@/components/ui/section-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunHistoryEntry } from "@/features/simulator/types";
import { cn } from "@/lib/utils";

type OverviewPanelsProps = {
  comparisonEntry: RunHistoryEntry | null;
  hiddenOpponentSeats: number;
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
  mutedTextClass,
  opponentSummary,
  panelCardClass,
  resultSummary,
}: OverviewPanelsProps) {
  return (
    <section className="grid items-stretch gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className={`${panelCardClass} h-full`}>
        <CardHeader className="pb-4">
          <CardTitle>
            <SectionTitle icon={Users} iconClassName="text-secondary">
              Seat Overview
            </SectionTitle>
          </CardTitle>
          <CardDescription>
            Review fixed and random opponent seats in the current table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-border/70 pb-3">
            <div>
              <p className={cn("text-sm", mutedTextClass)}>Fixed seats</p>
              <p className="mt-1 text-3xl font-semibold">{fixedSeatCount}</p>
            </div>
            <div>
              <p className={cn("text-sm", mutedTextClass)}>Random seats</p>
              <p className="mt-1 text-3xl font-semibold">{hiddenOpponentSeats}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className={cn("text-sm", mutedTextClass)}>Opponent summary</p>
              <p className="text-sm leading-6">{opponentSummary}</p>
            </div>
            <div className="border-t border-border/70 pt-3">
              <p className={cn("text-sm", mutedTextClass)}>History tools</p>
              <p className="mt-1.5 text-sm leading-6">
                Reload saved runs, compare outcomes, or export results.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${panelCardClass} h-full`}>
        <CardHeader className="pb-4">
          <CardTitle>
            <SectionTitle
              icon={comparisonEntry ? GitCompareArrows : CircleOff}
              iconClassName="text-[var(--color-chart-tie)]"
            >
              Comparison Summary
            </SectionTitle>
          </CardTitle>
          <CardDescription>
            Compare the current run against a selected baseline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparisonEntry ? (
            <>
              <div className="grid gap-3 border-b border-border/70 pb-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/70">
                <div className="sm:pr-4">
                  <p className={cn("text-sm", mutedTextClass)}>Win delta</p>
                  <p className="mt-1 text-[1.9rem] font-semibold leading-none">
                    {formatPercent(resultSummary.win - comparisonEntry.result.win)}
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className={cn("text-sm", mutedTextClass)}>Lose delta</p>
                  <p className="mt-1 text-[1.9rem] font-semibold leading-none">
                    {formatPercent(resultSummary.lose - comparisonEntry.result.lose)}
                  </p>
                </div>
                <div className="sm:pl-4">
                  <p className={cn("text-sm", mutedTextClass)}>Tie delta</p>
                  <p className="mt-1 text-[1.9rem] font-semibold leading-none">
                    {formatPercent(resultSummary.tie - comparisonEntry.result.tie)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn("text-sm", mutedTextClass)}>Baseline run</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{comparisonEntry.result.simulations.toLocaleString()} trials</span>
                    <span>{new Date(comparisonEntry.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm leading-6">{comparisonEntry.summary}</p>
                <p className={cn("text-xs font-medium", mutedTextClass)}>Saved baseline</p>
              </div>
            </>
          ) : (
            <div className="border-t border-border/70 pt-3">
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
