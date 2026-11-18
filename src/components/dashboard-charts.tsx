"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthPoint = { month: string; key: string; cost: number; energy: number };
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function DashboardCharts({
  data,
  variant,
}: {
  data: MonthPoint[];
  variant: "cost" | "energy";
}) {
  const isCost = variant === "cost";
  if (!data.some((item) => (isCost ? item.cost > 0 : item.energy > 0))) {
    return (
      <div className="empty-state">
        Seus gráficos aparecerão após registrar recargas.
      </div>
    );
  }
  return (
    <div
      className="chart-wrap"
      aria-label={
        isCost
          ? "Gráfico de gastos mensais"
          : "Gráfico de consumo de energia mensal"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke="#eef2f6"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={isCost ? 43 : 38}
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickFormatter={isCost ? (value: number) => `R$${value}` : undefined}
          />
          <Tooltip
            formatter={(value) =>
              isCost
                ? brl.format(Number(value))
                : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kWh`
            }
            contentStyle={{
              borderRadius: 9,
              border: "1px solid #e2e8f0",
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey={variant}
            name={isCost ? "Gasto" : "Energia"}
            stroke={isCost ? "#16a34a" : "#3b82f6"}
            strokeWidth={2.5}
            dot={{ r: 3, fill: isCost ? "#16a34a" : "#3b82f6" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
