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

import { HAND_LABELS, type MonteCarloResult } from "@/lib/poker";

const OUTCOME_COLORS = ["#0f766e", "#1f2937", "#d97706"];
const COMPARISON_COLOR = "#9ca3af";
const PANEL_CLASS = "rounded-[1.75rem] border border-border bg-card/92 p-5";

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

  const handBreakdownData = HAND_LABELS.map((label, index) => ({
    name: label,
    current: result.handBreakdown[index] ?? 0,
    comparison: comparison?.handBreakdown[index] ?? null,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <div className={PANEL_CLASS}>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Outcome Mix</h3>
          <p className="text-sm text-muted-foreground">
            Win, lose, and split-pot rates from the current setup.
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={outcomeData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={PANEL_CLASS}>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Comparison Bars</h3>
          <p className="text-sm text-muted-foreground">
            Compare the current run against a saved baseline when one is selected.
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonOutcomeData} barCategoryGap={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.16)" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatPercent(Number(value))} width={48} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar
                dataKey="current"
                name="Current run"
                fill="var(--color-chart-win)"
                radius={[8, 8, 0, 0]}
              />
              {comparison ? (
                <Bar
                  dataKey="comparison"
                  name="Comparison run"
                  fill={COMPARISON_COLOR}
                  radius={[8, 8, 0, 0]}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${PANEL_CLASS} xl:col-span-2`}>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Hand Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Final hero made-hand frequencies from the most recent run.
          </p>
        </div>
        <div className="h-[28rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={handBreakdownData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.14)" />
              <XAxis type="number" tickFormatter={(value) => formatPercent(Number(value))} />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar
                dataKey="current"
                name="Current run"
                fill="var(--color-chart-tie)"
                radius={[0, 8, 8, 0]}
              />
              {comparison ? (
                <Bar
                  dataKey="comparison"
                  name="Comparison run"
                  fill={COMPARISON_COLOR}
                  radius={[0, 8, 8, 0]}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
