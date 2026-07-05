import { ClipboardX, Clock, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

const CARDS = [
  {
    icon: ClipboardX,
    title: "Falta de estrutura",
    description:
      "Questionários em papel ou planilhas soltas geram registros dispersos e difíceis de comparar entre sessões.",
  },
  {
    icon: Clock,
    title: "Análise demorada",
    description:
      "Somar e interpretar escalas manualmente consome tempo clínico precioso e abre espaço para erros.",
  },
  {
    icon: EyeOff,
    title: "Padrões invisíveis",
    description:
      "Sem visualização da evolução, tendências e sinais de agravamento passam despercebidos ao longo do tratamento.",
  },
];

/** RF-04 — O Desafio: análise manual deixa padrões clínicos invisíveis. */
export function Challenge() {
  return (
    <section id="desafio" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="O desafio"
          title="Análise manual deixa padrões clínicos invisíveis"
          description="Psicólogos gastam tempo precioso organizando respostas subjetivas, enquanto os dados estruturados que gerariam imagem do paciente ficam perdidos em pilhas de papel e planilhas instáveis."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <Card className="h-full p-7">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary/30 text-primary">
                  <card.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
