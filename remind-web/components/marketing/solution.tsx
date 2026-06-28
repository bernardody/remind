import { Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { LazyBarChart } from "@/components/charts/lazy-bar-chart";
import type { BarDatum } from "@/components/charts/bar-chart";

const BENEFITS = [
  "Escalas validadas prontas para aplicar (CARS, UCLA, SPI e novas escalas).",
  "Relatórios clínicos gerados automaticamente a cada resposta.",
  "Histórico de evolução por paciente, com comparação entre avaliações.",
];

const CHART_DATA: BarDatum[] = [
  { label: "Jan", value: 3.8, color: "#C0432F" },
  { label: "Fev", value: 3.1, color: "#E0A21F" },
  { label: "Mar", value: 2.4, color: "#E0A21F" },
  { label: "Abr", value: 1.7, color: "#1A7A6E" },
  { label: "Mai", value: 1.4, color: "#1A7A6E" },
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
            organiza tudo em uma visão clínica clara — para você focar na
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
              <Legend color="#C0432F" label="Alto" />
              <Legend color="#E0A21F" label="Moderado" />
              <Legend color="#1A7A6E" label="Baixo" />
            </div>
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
