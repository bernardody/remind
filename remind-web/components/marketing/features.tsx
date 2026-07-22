import {
  BadgeCheck,
  FileText,
  LineChart,
  SendHorizontal,
  UserCircle,
  Lock,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Triagem Baseada em Evidências",
    description:
      "Eixos de avaliação inspirados na literatura científica sobre dependência digital — não substitui avaliação clínica formal.",
  },
  {
    icon: FileText,
    title: "Relatórios Clínicos Automáticos",
    description:
      "Escores e interpretações gerados a cada resposta, prontos para o prontuário.",
  },
  {
    icon: LineChart,
    title: "Monitoramento de Evolução",
    description:
      "Acompanhe a trajetória do paciente ao longo do tempo, avaliação após avaliação.",
  },
  {
    icon: SendHorizontal,
    title: "Envio Digital para o Paciente",
    description:
      "Questionários enviados digitalmente, respondidos com conforto e sem atrito.",
  },
  {
    icon: UserCircle,
    title: "Perfil Completo por Paciente",
    description:
      "Histórico, respostas e resultados reunidos em uma ficha clínica organizada.",
  },
  {
    icon: Lock,
    title: "Dados Protegidos",
    description:
      "Armazenamento seguro e em conformidade com a LGPD para dados sensíveis de saúde.",
  },
];

/** RF-07 — Recursos: grade de 6 cards. */
export function Features() {
  return (
    <section id="recursos" className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Recursos"
          title="Tudo o que você precisa com rigor científico"
          description="Da aplicação da escala ao acompanhamento longitudinal — uma plataforma completa para a avaliação clínica da dependência digital."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <Card className="h-full p-7 transition-shadow hover:shadow-card">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
