import type { MonteCarloResult } from "@/lib/poker";

export type ExportableRunHistoryEntry = {
  createdAt: string;
  summary: string;
  result: MonteCarloResult;
};

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildRunHistoryCsv(entries: ExportableRunHistoryEntry[]) {
  const header = [
    "createdAt",
    "summary",
    "win",
    "lose",
    "tie",
    "simulations",
    "opponents",
    "elapsedMs",
  ].join(",");

  const rows = entries.map((entry) =>
    [
      escapeCsvCell(entry.createdAt),
      escapeCsvCell(entry.summary),
      entry.result.win,
      entry.result.lose,
      entry.result.tie,
      entry.result.simulations,
      entry.result.opponents,
      entry.result.elapsedMs,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
