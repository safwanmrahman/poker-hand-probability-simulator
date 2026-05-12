import { cn } from "@/lib/utils";

export function HandBreakdownList({
  handBreakdown,
  formatPercent,
}: {
  handBreakdown: readonly (readonly [string, number])[];
  formatPercent: (value: number) => string;
}) {
  return (
    <div className="space-y-4">
      {handBreakdown.map(([label, value]) => (
        <div key={label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <span className="font-medium">{formatPercent(value)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
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
