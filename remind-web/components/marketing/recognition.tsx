import {
  FlaskConical,
  Landmark,
  Lightbulb,
  Medal,
  Rocket,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { AnimatedCounter } from "@/components/marketing/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils";

interface Stat {
  icon: LucideIcon;
  value: number | null;
  label: string;
}

const STATS: Stat[] = [
  { icon: Trophy, value: 3, label: "Premiações" },
  { icon: Rocket, value: 2, label: "Programas de inovação" },
  { icon: FlaskConical, value: 6, label: "Eventos e feiras" },
  { icon: Landmark, value: null, label: "Reconhecimento nacional" },
];

interface Recognition {
  icon: LucideIcon;
  place?: string;
  name: string;
  description: string;
  badge: string;
}

const RECOGNITIONS: Recognition[] = [
  {
    icon: Trophy,
    place: "1º Lugar",
    name: "Fórum Sinodal",
    description:
      "Reconhecimento entre projetos apresentados pelas escolas da Rede Sinodal de Educação de todo o Brasil.",
    badge: "Campeão",
  },
  {
    icon: Trophy,
    place: "1º Lugar",
    name: "FITEC",
    description: "Categoria Ensino Médio, entre projetos de base científica e tecnológica.",
    badge: "Campeão",
  },
  {
    icon: Medal,
    place: "3º Lugar",
    name: "MOSTRATEC",
    description:
      "Premiado na área de História e Ciências Sociais, uma das maiores feiras de ciência da América Latina.",
    badge: "Top 3",
  },
  {
    icon: Rocket,
    name: "Sinos Startando",
    description:
      "Programa de pré-incubação com incentivo do Sebrae, com mentorias para validação e desenvolvimento do negócio.",
    badge: "Programa de inovação",
  },
  {
    icon: Lightbulb,
    name: "Desafio Impulso",
    description:
      "Selecionado para a 6ª turma do programa de desenvolvimento empreendedor da ITEL, para negócios em fase de pré-incubação.",
    badge: "Pré-incubação",
  },
  {
    icon: FlaskConical,
    name: "FEBIC",
    description: "Projeto selecionado para apresentação na Feira Brasileira de Iniciação Científica.",
    badge: "Feira nacional",
  },
];

const SUPPORTERS = [
  "Sebrae",
  "Sinos Startando",
  "MOSTRATEC",
  "FEBIC",
  "FITEC",
  "Fórum Sinodal",
  "ITEL",
];

/** RF-10 — Reconhecimento e apoio: prova social via premiações e programas de inovação. */
export function Recognition() {
  return (
    <section className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Reconhecimento e apoio"
          title="Validado antes de chegar até você"
          description="O ReMind foi reconhecido em programas de inovação, empreendedorismo e feiras científicas, conquistando premiações que reforçam sua relevância acadêmica, tecnológica e seu potencial de impacto na saúde mental."
        />

        <Reveal className="mt-14 grid grid-cols-2 gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft sm:grid-cols-4 sm:p-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="size-5" />
              </span>
              {stat.value !== null ? (
                <AnimatedCounter
                  value={stat.value}
                  className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
                />
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  Nacional
                </span>
              )}
              <p className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECOGNITIONS.map((item, i) => (
            <Reveal key={item.name} delay={(i % 3) * 0.08}>
              <Card className="group h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="size-6" />
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {item.badge}
                  </Badge>
                </div>

                {item.place && (
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.place}
                  </p>
                )}
                <h3 className={cn("text-2xl font-semibold", item.place ? "mt-1" : "mt-5")}>
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-16 border-t border-border pt-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Instituições e programas de apoio
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {SUPPORTERS.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
