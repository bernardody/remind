"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import type { ScaleResult } from "@/features/results/schemas";
import { getRiskBandByLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DomainBarsProps {
  data: ScaleResult[];
  max?: number;
  height?: number;
  className?: string;
}

const NEUTRAL_COLOR = "var(--color-muted-foreground)";

/**
 * Breakdown do escore por escala (Fase 5). Cada barra repete o nível de risco como
 * texto visível junto da cor (nunca só cor, mesma regra do `gauge.tsx`/`RISK_BANDS`).
 * `riskLabel` nulo (escala sem faixas cadastradas) cai numa cor neutra com "Sem faixa".
 */
export function DomainBars({ data, max = 5, height = 220, className }: DomainBarsProps) {
  if (data.length === 0) return null;

  const chartData = data.map((scale) => ({
    ...scale,
    band: getRiskBandByLabel(scale.riskLabel),
  }));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
            barCategoryGap="28%"
          >
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
            <XAxis
              dataKey="scaleName"
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
            <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.band?.color ?? NEUTRAL_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-col gap-2">
        {chartData.map((entry) => (
          <li
            key={entry.scaleId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="font-medium text-foreground">{entry.scaleName}</span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums text-muted-foreground">
                {entry.average.toFixed(1)} de {max}
              </span>
              <Badge
                variant="risk"
                className="px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: entry.band?.color ?? NEUTRAL_COLOR,
                  color: entry.band?.textColor ?? "#FFFFFF",
                }}
              >
                {entry.band ? `Risco ${entry.band.label.toLowerCase()}` : "Sem faixa"}
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
