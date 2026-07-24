"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { Badge } from "@/components/ui/badge";
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
 * A régua de faixas abaixo do badge é decorativa (posição do marcador replica o
 * `percent` já descrito no `aria-label`), por isso fica `aria-hidden`.
 */
export function Gauge({ value, max = 5, size = 240, className }: GaugeProps) {
  const band = getRiskBand(value);
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = (clamped / max) * 100;
  const data = [{ name: "score", value: percent, fill: band.color }];
  const label = `Escore médio ${value.toFixed(1)} de ${max}, risco ${band.label.toLowerCase()}`;
  const chartHeight = size / 2 + 12;

  return (
    <div
      className={cn("flex w-full flex-col items-center gap-5", className)}
      role="img"
      aria-label={label}
    >
      <div className="relative" style={{ width: size, height: chartHeight }}>
        <RadialBarChart
          width={size}
          height={chartHeight}
          cx="50%"
          cy="100%"
          innerRadius="74%"
          outerRadius="100%"
          barSize={20}
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "var(--color-muted)" }}
          />
        </RadialBarChart>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-1">
          <span className="flex items-baseline gap-1">
            <span className="text-5xl font-black tracking-tight text-foreground tabular-nums">
              {value.toFixed(1)}
            </span>
            <span className="text-base font-medium text-muted-foreground">/{max}</span>
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Escore médio
          </span>
        </div>
      </div>

      <Badge
        variant="risk"
        className="px-3.5 py-1 text-sm font-semibold"
        style={{ backgroundColor: band.color, color: band.textColor }}
      >
        Risco {band.label.toLowerCase()}
      </Badge>

      <div className="flex w-full max-w-[260px] flex-col gap-1.5" aria-hidden="true">
        <div className="relative h-1.5 w-full rounded-full">
          <div className="flex h-full w-full overflow-hidden rounded-full">
            {RISK_BANDS.map((riskBand) => (
              <div
                key={riskBand.label}
                className="h-full transition-opacity"
                style={{
                  width: `${((riskBand.max - riskBand.min) / max) * 100}%`,
                  backgroundColor: riskBand.color,
                  opacity: riskBand.label === band.label ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-soft"
            style={{ left: `${percent}%`, backgroundColor: band.color }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          {RISK_BANDS.map((riskBand) => (
            <span
              key={riskBand.label}
              className={cn(
                "transition-colors",
                riskBand.label === band.label && "font-semibold text-foreground",
              )}
            >
              {riskBand.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
