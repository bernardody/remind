"use client";

import { Badge } from "@/components/ui/badge";
import type { ScaleResult } from "@/features/results/schemas";
import { getRiskBandByLabel } from "@/lib/constants";
import { getScaleDisplayName } from "@/lib/scales";
import { cn } from "@/lib/utils";

interface DomainBarsProps {
  data: ScaleResult[];
  max?: number;
  className?: string;
}

const NEUTRAL_COLOR = "var(--color-muted-foreground)";

/**
 * Breakdown do escore por escala (Fase 5). Cada linha já é sua própria barra
 * horizontal — nome, valor e badge de risco ficam no mesmo elemento que a barra
 * (nada de chart + lista redundantes lado a lado). Cada barra repete o nível de
 * risco como texto visível junto da cor (nunca só cor, mesma regra do
 * `gauge.tsx`/`RISK_BANDS`). `riskLabel` nulo (escala sem faixas cadastradas) cai
 * numa cor neutra com "Sem faixa".
 */
export function DomainBars({ data, max = 5, className }: DomainBarsProps) {
  if (data.length === 0) return null;

  const chartData = data.map((scale) => ({
    ...scale,
    band: getRiskBandByLabel(scale.riskLabel),
  }));

  return (
    <ul className={cn("flex flex-col gap-5", className)}>
      {chartData.map((entry) => {
        const percent = (Math.min(Math.max(entry.average, 0), max) / max) * 100;
        const color = entry.band?.color ?? NEUTRAL_COLOR;

        return (
          <li key={entry.scaleId} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">
                {getScaleDisplayName(entry.scaleName)}
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {entry.average.toFixed(1)}
                  <span className="text-xs">/{max}</span>
                </span>
                <Badge
                  variant="risk"
                  className="px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: color,
                    color: entry.band?.textColor ?? "#FFFFFF",
                  }}
                >
                  {entry.band ? `Risco ${entry.band.label.toLowerCase()}` : "Sem faixa"}
                </Badge>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
