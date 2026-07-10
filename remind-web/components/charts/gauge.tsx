"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { getRiskBand, RISK_BANDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}

/**
 * Escore clínico real (ao contrário do `bar-chart.tsx` decorativo da landing,
 * que é `aria-hidden`) — leva `role="img"` com descrição textual completa e
 * repete o nível de risco como texto visível, nunca só cor (regra de `RISK_BANDS`).
 */
export function Gauge({ value, max = 5, size = 220, className }: GaugeProps) {
  const band = getRiskBand(value);
  const percent = (Math.min(Math.max(value, 0), max) / max) * 100;
  const data = [{ name: "score", value: percent, fill: band.color }];
  const label = `Escore médio ${value.toFixed(1)} de ${max} — risco ${band.label.toLowerCase()}`;
  const chartHeight = size / 2 + 16;

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="img"
      aria-label={label}
    >
      <div className="relative" style={{ width: size, height: chartHeight }}>
        <RadialBarChart
          width={size}
          height={chartHeight}
          cx="50%"
          cy="100%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={18}
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={9}
            background={{ fill: "var(--color-muted)" }}
          />
        </RadialBarChart>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
          <span className="text-3xl font-extrabold text-foreground">
            {value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">de {max}</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-sm font-semibold text-white"
        style={{ backgroundColor: band.color }}
      >
        Risco {band.label.toLowerCase()}
      </span>

      <div className="flex items-center gap-4" aria-hidden="true">
        {RISK_BANDS.map((riskBand) => (
          <div
            key={riskBand.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity",
              riskBand.label === band.label
                ? "font-semibold text-foreground"
                : "text-muted-foreground opacity-60",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: riskBand.color }}
            />
            {riskBand.label}
          </div>
        ))}
      </div>
    </div>
  );
}
