"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS } from "@/components/StatusBadge";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe",
  "#818cf8", "#93c5fd", "#60a5fa", "#34d399", "#4ade80",
  "#f87171", "#fb923c", "#fbbf24",
];

interface StatusBreakdownChartProps {
  data: { status: ApplicationStatus; count: number }[];
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status],
      value: d.count,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
