import { Quote } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

/** RF-03 — Faixa de impacto (fundo teal, ícone de aspas, estatística). */
export function ImpactBand() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <Reveal className="flex flex-col items-center gap-6">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Quote className="size-7" />
          </span>
          <p className="text-balance text-2xl font-bold leading-snug sm:text-3xl">
            Mais de <span className="underline decoration-2 underline-offset-4">210 milhões</span>{" "}
            de pessoas no mundo apresentam comportamentos de dependência digital,
            e a psicologia clínica ainda não tinha uma ferramenta feita para
            medir isso com precisão.
          </p>
          <p className="max-w-2xl text-pretty text-base text-primary-foreground/80">
            O ReMind nasceu para dar estrutura, escala e clareza a quem cuida da
            saúde mental, transformando respostas em dados clínicos confiáveis.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
