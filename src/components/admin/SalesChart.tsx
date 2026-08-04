"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

interface SalesPoint {
  date: string;
  total: number;
}

function shortDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: SalesPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-700">{shortDateLabel(point.date)}</p>
      <p className="text-primary-600">{formatCurrency(point.total)}</p>
    </div>
  );
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap={data.length > 15 ? "20%" : "35%"}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDateLabel}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          interval={data.length > 10 ? Math.ceil(data.length / 8) : 0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-primary-100)" }} />
        <Bar dataKey="total" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
