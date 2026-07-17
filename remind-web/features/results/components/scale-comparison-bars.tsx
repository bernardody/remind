"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { ApplicationResult } from "@/features/results/schemas";
import { BRAND_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface ScaleComparisonBarsProps {
  first: ApplicationResult;
  last: ApplicationResult;
  max?: number;
  height?: number;
}

/**
 * Comparação ponta-a-ponta entre duas aplicações (docs/specs/003-relatorios-evolucao-longitudinal/
 * PRD.md §5.2/§7.5). Barras agrupadas, não radar: leitura precisa de valor por escala é mais
 * importante aqui que a intuição de "forma" — radar tem problemas conhecidos de distorção de
 * área e leitura imprecisa, e o produto já tem um padrão de rigor de acessibilidade (WCAG) que
 * pesa contra ele como escolha padrão. Cores diferenciam por ORDEM temporal (clara/escura), não
 * por semântica de risco — evita colidir com a paleta de `RISK_BANDS`.
 */
export function ScaleComparisonBars({ first, last, max = 5, height = 260 }: ScaleComparisonBarsProps) {
  const scaleNames = Array.from(
    new Set([...first.scaleResults, ...last.scaleResults].map((s) => s.scaleName)),
  );

  const chartData = scaleNames.map((scaleName) => ({
    scaleName,
    primeira: first.scaleResults.find((s) => s.scaleName === scaleName)?.average ?? null,
    recente: last.scaleResults.find((s) => s.scaleName === scaleName)?.average ?? null,
  }));

  const firstLabel = formatDate(first.answeredAt);
  const lastLabel = formatDate(last.answeredAt);

  return (
    <div
      role="img"
      aria-label={`Comparação por escala entre a aplicação de ${firstLabel} e a de ${lastLabel}`}
    >
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
            width={28}
          />
          <Legend
            formatter={(value) => (value === "primeira" ? firstLabel : lastLabel)}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="primeira" name="primeira" fill={BRAND_COLORS.mist} radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar dataKey="recente" name="recente" fill={BRAND_COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
