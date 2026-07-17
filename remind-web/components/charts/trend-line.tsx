"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { RISK_BANDS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

export interface TrendLinePoint {
  answeredAt: string;
  average: number;
}

interface TrendLineProps {
  scaleName: string;
  data: TrendLinePoint[];
  max?: number;
  height?: number;
  className?: string;
}

/**
 * Evolução de uma escala ao longo do tempo (Fase 5b, docs/specs/
 * 003-relatorios-evolucao-longitudinal/PRD.md §5.2/§7.2). Linha é a escolha certa aqui — a
 * pergunta clínica é direção/velocidade de mudança ao longo do tempo, não um snapshot pontual
 * (isso já é o `DomainBars`). Eixo X usa a data real de cada aplicação (espaçamento não
 * uniforme comunica o intervalo entre rodadas). Faixas de fundo repetem a mesma paleta de risco
 * de `Gauge`/`DomainBars` — nunca introduz cor nova pra "tendência" (PRD.md raiz §6, Fase 4).
 */
export function TrendLine({ scaleName, data, max = 5, height = 220, className }: TrendLineProps) {
  if (data.length === 0) return null;

  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.answeredAt),
  }));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-medium text-foreground">{scaleName}</span>
      <div
        role="img"
        aria-label={`Evolução de ${scaleName} ao longo de ${data.length} aplicações, de ${chartData[0].average.toFixed(1)} até ${chartData[chartData.length - 1].average.toFixed(1)}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
            {RISK_BANDS.map((band) => (
              <ReferenceArea
                key={band.label}
                y1={band.min}
                y2={band.max}
                fill={band.color}
                fillOpacity={0.1}
                ifOverflow="hidden"
              />
            ))}
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
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
              width={28}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-primary)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
