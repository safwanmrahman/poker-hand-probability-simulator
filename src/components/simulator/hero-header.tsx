import {
  ArrowRight,
  MoonStar,
  RotateCcw,
  SunMedium,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroHeaderProps = {
  boardStage: string;
  isDarkMode: boolean;
  isRunningSimulation: boolean;
  opponentCount: number;
  parsedSimulationCount: number;
  scenarioSummary: string;
  fixedSeatCount: number;
  heroRunButtonClass: string;
  outlineButtonClass: string;
  themeMode: "light" | "dark";
  onDealRandomSetup: () => void;
  onResetTable: () => void;
  onRunSimulation: () => void;
  onCancelSimulation: () => void;
  onToggleThemeMode: () => void;
  canRunSimulation: boolean;
};

export function HeroHeader({
  boardStage,
  canRunSimulation,
  fixedSeatCount,
  heroRunButtonClass,
  isDarkMode,
  isRunningSimulation,
  opponentCount,
  outlineButtonClass,
  parsedSimulationCount,
  scenarioSummary,
  themeMode,
  onCancelSimulation,
  onDealRandomSetup,
  onResetTable,
  onRunSimulation,
  onToggleThemeMode,
}: HeroHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-[1.75rem] border px-4 py-4 sm:px-5 sm:py-5",
        isDarkMode
          ? "border-white/10 bg-[linear-gradient(180deg,rgba(11,23,32,0.9),rgba(8,17,24,0.94))] shadow-[0_20px_48px_-36px_rgba(0,0,0,0.5)]"
          : "border-[#dfcfba] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(248,241,232,0.98))] shadow-[0_18px_42px_-34px_rgba(40,24,12,0.18)]",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <div className="hidden lg:block" />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="space-y-2">
            <h1 className="text-[2rem] font-semibold leading-tight sm:text-[2.35rem]">
              Texas Hold&apos;em Probability Simulator
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Build a table, choose fixed or random opponents, and run simulations to view
              estimated odds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", outlineButtonClass)}
            onClick={onToggleThemeMode}
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
            size="sm"
            className={cn("gap-2", outlineButtonClass)}
            onClick={onDealRandomSetup}
            disabled={isRunningSimulation}
          >
            <WandSparkles className="size-4" />
            Random table
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", outlineButtonClass)}
            onClick={onResetTable}
            disabled={isRunningSimulation}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3 rounded-[1.35rem] border px-4 py-4 text-sm md:grid-cols-[1fr_auto] md:items-center",
          isDarkMode ? "border-white/10 bg-black/10" : "border-[#dfcfba] bg-white/75",
        )}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <span className="rounded-full border border-border bg-background/50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {boardStage}
          </span>
          <span className="rounded-full border border-border bg-background/50 px-3 py-1">
            {parsedSimulationCount.toLocaleString()} trials
          </span>
          <span className="rounded-full border border-border bg-background/50 px-3 py-1">
            {opponentCount} opponent{opponentCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-border bg-background/50 px-3 py-1">
            {fixedSeatCount} fixed seat{fixedSeatCount === 1 ? "" : "s"}
          </span>
        </div>

        <p className="text-center text-sm leading-6 text-muted-foreground md:text-right">
          {scenarioSummary}
        </p>
      </div>

      <div
        className={cn(
          "rounded-[1.45rem] border px-4 py-4",
          isDarkMode
            ? "border-white/10 bg-[linear-gradient(135deg,#103c32,#102a2a_58%,#122126)] text-white shadow-[0_18px_48px_-30px_rgba(6,24,21,0.7)]"
            : "border-[#d8c8b4] bg-[linear-gradient(135deg,#214b42,#183937_62%,#20312f)] text-white shadow-[0_18px_42px_-28px_rgba(21,39,35,0.38)]",
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Run simulations
            </p>
            <p className="text-sm leading-6 text-white/80">
              View odds for the current table and keep your setup ready for the next run.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="lg"
              className={heroRunButtonClass}
              onClick={onRunSimulation}
              disabled={!canRunSimulation || isRunningSimulation}
            >
              {isRunningSimulation ? "Running..." : "Run simulations"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
            {isRunningSimulation ? (
              <Button
                variant="outline"
                size="lg"
                className="border-white/18 bg-white/8 text-white hover:bg-white/14"
                onClick={onCancelSimulation}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
