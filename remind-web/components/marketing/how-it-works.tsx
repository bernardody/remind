import { UserPlus, Send, BarChart3, TrendingUp } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Cadastre o Paciente",
    description:
      "Crie o perfil do paciente em segundos e mantenha todo o histórico clínico em um só lugar.",
  },
  {
    n: "02",
    icon: Send,
    title: "Envie o Questionário",
    description:
      "Selecione a escala adequada e envie digitalmente — o paciente responde de onde estiver.",
  },
  {
    n: "03",
    icon: BarChart3,
    title: "Analise os Resultados",
    description:
      "Escores e relatórios são calculados automaticamente, prontos para leitura clínica.",
  },
  {
    n: "04",
    icon: TrendingUp,
    title: "Acompanhe a Evolução",
    description:
      "Compare avaliações ao longo do tempo e visualize a trajetória de cada paciente.",
  },
];

/** RF-06 — Como funciona: 4 etapas numeradas. */
export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Como funciona"
          title="Em quatro etapas simples, o diagnóstico clínico evolui"
          description="Integre o ReMind à sua rotina clínica com uma visão técnica e estruturada da saúde mental digital dos seus pacientes."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                <span className="text-4xl font-extrabold text-secondary">
                  {step.n}
                </span>
                <span className="mt-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
