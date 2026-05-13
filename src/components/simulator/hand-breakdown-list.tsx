import { cn } from "@/lib/utils";

export function HandBreakdownList({
  handBreakdown,
  formatPercent,
}: {
  handBreakdown: readonly (readonly [string, number])[];
  formatPercent: (value: number) => string;
}) {
  return (
    <div className="divide-y divide-border/60">
      {handBreakdown.map(([label, value]) => (
        <div key={label} className="space-y-0.5 py-1.5 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between text-[0.91rem] leading-5">
            <span>{label}</span>
            <span className="font-medium">{formatPercent(value)}</span>
          </div>
          <div className="h-1.25 rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                "bg-[linear-gradient(90deg,var(--color-chart-win),var(--color-chart-tie))]",
              )}
              style={{ width: `${Math.max(Number(value), 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
