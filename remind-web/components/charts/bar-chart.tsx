"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  /** Domínio máximo do eixo Y (ex.: 5 para escalas Likert 1–5). */
  max?: number;
  height?: number;
  className?: string;
}

const DEFAULT_COLOR = "#1A7A6E";

/**
 * Wrapper Recharts para a visualização ilustrativa da seção "Solução".
 * Datasets pequenos → SVG declarativo. (Charts clínicos reais ficam na Spec 04.)
 */
export function BarChart({
  data,
  max = 5,
  height = 220,
  className,
}: BarChartProps) {
  return (
    <div className={className} aria-hidden="true">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
          />
          <YAxis
            domain={[0, max]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.45 }}
            width={32}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ?? DEFAULT_COLOR}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
