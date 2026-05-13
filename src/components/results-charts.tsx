"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonteCarloResult } from "@/lib/poker";

const OUTCOME_COLORS = ["#0f766e", "#1f2937", "#d97706"];
const COMPARISON_COLOR = "#9ca3af";
const LEGEND_STYLE = { paddingTop: 10, fontSize: 12 };

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return formatPercent(Number(normalizedValue ?? 0));
}

export function ResultsCharts({
  result,
  comparison,
}: {
  result: MonteCarloResult;
  comparison: MonteCarloResult | null;
}) {
  const outcomeData = [
    { name: "Win", value: result.win },
    { name: "Lose", value: result.lose },
    { name: "Tie", value: result.tie },
  ];

  const comparisonOutcomeData = [
    { name: "Win", current: result.win, comparison: comparison?.win ?? null },
    { name: "Lose", current: result.lose, comparison: comparison?.lose ?? null },
    { name: "Tie", current: result.tie, comparison: comparison?.tie ?? null },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:divide-x lg:divide-border/60">
      <div className="min-w-0 lg:pr-6">
        <div className="mb-2">
          <h3 className="text-base font-semibold">Outcome Mix</h3>
          <p className="text-sm text-muted-foreground">
            Win, lose, and split-pot rates from the current setup.
          </p>
        </div>
        <div className="h-58 min-h-[14.5rem] min-w-0 sm:h-60">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={232}>
            <PieChart>
              <Pie
                data={outcomeData}
                dataKey="value"
                nameKey="name"
                innerRadius={64}
                outerRadius={94}
                paddingAngle={4}
              >
                {outcomeData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={["var(--color-chart-win)", "var(--color-chart-loss)", "var(--color-chart-tie)"][index] ?? OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend wrapperStyle={LEGEND_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="min-w-0 lg:pl-6">
        <div className="mb-2">
          <h3 className="text-base font-semibold">Comparison Bars</h3>
          <p className="text-sm text-muted-foreground">
            Compare the current run against a saved baseline when one is selected.
          </p>
        </div>
        <div className="h-58 min-h-[14.5rem] min-w-0 sm:h-60">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={232}>
            <BarChart
              data={comparisonOutcomeData}
              barCategoryGap={16}
              margin={{ top: 2, right: 2, left: -4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.16)" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatPercent(Number(value))} width={48} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar
                dataKey="current"
                name="Current run"
                fill="var(--color-chart-win)"
                radius={[5, 5, 0, 0]}
              />
              {comparison ? (
                <Bar
                  dataKey="comparison"
                  name="Comparison run"
                  fill={COMPARISON_COLOR}
                  radius={[5, 5, 0, 0]}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
