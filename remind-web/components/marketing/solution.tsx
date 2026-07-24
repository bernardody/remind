import { Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { LazyBarChart } from "@/components/charts/lazy-bar-chart";
import type { BarDatum } from "@/components/charts/bar-chart";
import { getRiskBandByLabel } from "@/lib/constants";

const BENEFITS = [
  "Triagem própria por eixos, inspirada na literatura sobre dependência digital.",
  "Relatórios clínicos gerados automaticamente a cada resposta.",
  "Histórico de evolução por paciente, com comparação entre avaliações.",
];

/**
 * Mesma rampa monocromática de teal usada no produto real (`RISK_BANDS`,
 * gauge/domain-bars) — nunca semáforo vermelho/âmbar/verde. Decisão de
 * produto (PRD.md §0/§4.18): a landing precisa falar a mesma linguagem
 * visual de risco que o app autenticado, não uma linguagem própria.
 */
function riskColor(label: "Baixo" | "Moderado" | "Alto") {
  return getRiskBandByLabel(label)?.color ?? "#1A7A6E";
}

const CHART_DATA: BarDatum[] = [
  { label: "Jan", value: 3.8, color: riskColor("Alto") },
  { label: "Fev", value: 3.1, color: riskColor("Moderado") },
  { label: "Mar", value: 2.4, color: riskColor("Moderado") },
  { label: "Abr", value: 1.7, color: riskColor("Baixo") },
  { label: "Mai", value: 1.4, color: riskColor("Baixo") },
];

/** RF-05 — A Solução: plataforma para o psicólogo que leva dados a sério. */
export function Solution() {
  return (
    <section id="solucao" className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            A solução
          </span>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Uma plataforma construída para o psicólogo que leva dados a sério
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            O ReMind digitaliza a coleta de respostas, calcula os escores e
            organiza tudo em uma visão clínica clara, para você focar na
            interpretação, não na operação.
          </p>

          <ul className="mt-2 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-foreground sm:text-base">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Reveal>
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Rodrigo M. Prado</p>
                <p className="text-xs text-muted-foreground">
                  Evolução do escore médio · 2025
                </p>
              </div>
              <span className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold text-primary">
                -63% no risco
              </span>
            </div>

            <div className="mt-6 text-foreground">
              <LazyBarChart data={CHART_DATA} max={5} height={220} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Legend color={riskColor("Alto")} label="Alto" />
              <Legend color={riskColor("Moderado")} label="Moderado" />
              <Legend color={riskColor("Baixo")} label="Baixo" />
            </div>

            <p className="mt-4 text-[11px] italic leading-relaxed text-muted-foreground/70">
              *Nome e dados ilustrativos, este paciente não é real.
            </p>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
