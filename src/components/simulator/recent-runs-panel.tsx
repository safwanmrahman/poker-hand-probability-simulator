"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, GitCompareArrows, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { RunHistoryEntry } from "@/features/simulator/types";
import { cn } from "@/lib/utils";

type RecentRunsPanelProps = {
  comparisonRunId: string | null;
  loadHistoryEntry: (entry: RunHistoryEntry) => void;
  mutedPanelClass: string;
  mutedTextClass: string;
  outlineButtonClass: string;
  panelCardClass: string;
  runHistory: RunHistoryEntry[];
  setComparisonRunId: (value: string | null | ((currentId: string | null) => string | null)) => void;
  formatPercent: (value: number) => string;
};

const COLLAPSED_RUN_COUNT = 3;

export function RecentRunsPanel({
  comparisonRunId,
  formatPercent,
  loadHistoryEntry,
  mutedPanelClass,
  mutedTextClass,
  outlineButtonClass,
  panelCardClass,
  runHistory,
  setComparisonRunId,
}: RecentRunsPanelProps) {
  const [showAllRuns, setShowAllRuns] = useState(false);
  const visibleRuns = useMemo(
    () => (showAllRuns ? runHistory : runHistory.slice(0, COLLAPSED_RUN_COUNT)),
    [runHistory, showAllRuns],
  );
  const hasMoreRuns = runHistory.length > COLLAPSED_RUN_COUNT;

  return (
    <Card className={panelCardClass}>
      <CardHeader className="pb-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              <SectionTitle icon={History} iconClassName="text-[var(--color-chart-tie)]">
                Recent Runs
              </SectionTitle>
            </CardTitle>
            <CardDescription>Reload, compare, and export recent results.</CardDescription>
          </div>
          {hasMoreRuns ? (
            <Button
              variant="outline"
              size="sm"
              className={outlineButtonClass}
              onClick={() => setShowAllRuns((current) => !current)}
            >
              {showAllRuns ? "Show less" : "Show more"}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-0">
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
          <div className={cn(showAllRuns && hasMoreRuns ? "max-h-[20rem] overflow-y-auto pr-1" : "")}>
            <div className="divide-y divide-border/70">
              {visibleRuns.map((entry) => {
                const isSelectedForComparison = comparisonRunId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-5">{entry.summary}</p>
                        <p className={cn("mt-1 text-xs leading-5", mutedTextClass)}>
                          {new Date(entry.createdAt).toLocaleString()} •{" "}
                          {entry.result.simulations.toLocaleString()} trials
                        </p>
                      </div>
                      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/8 px-2 py-1 text-[11px] font-medium leading-none text-primary">
                        <CheckCircle2 className="size-3.5" />
                        {formatPercent(entry.result.win)}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-8 min-w-[4.5rem] justify-center", outlineButtonClass)}
                        onClick={() => loadHistoryEntry(entry)}
                      >
                        Load
                      </Button>
                      <Button
                        variant={isSelectedForComparison ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 min-w-[6rem] justify-center",
                          isSelectedForComparison ? "" : outlineButtonClass,
                        )}
                        onClick={() =>
                          setComparisonRunId((currentId) =>
                            currentId === entry.id ? null : entry.id,
                          )
                        }
                      >
                        <GitCompareArrows className="mr-1.5 size-3.5 shrink-0" />
                        {isSelectedForComparison ? "Comparing" : "Compare"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
