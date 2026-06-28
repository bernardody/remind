import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { ROUTES } from "@/lib/constants";

/** RF-02 — Hero: badge, headline, subtítulo, CTAs e preview do app. */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24"
    >
      {/* respiro de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, color-mix(in srgb, var(--color-mist) 35%, transparent) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div className="flex flex-col items-start gap-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-soft">
              <Sparkles className="size-4" />
              Avaliação clínica de dependência digital
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              A primeira plataforma de avaliação de{" "}
              <span className="text-primary">dependência digital</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Aplique escalas psicométricas validadas de forma digital, calcule
              resultados automaticamente e acompanhe a evolução dos seus
              pacientes com precisão clínica.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={ROUTES.demoAnchor}>
                  Comece agora grátis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#como-funciona">
                  <PlayCircle className="size-4" />
                  Ver como funciona
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Dados protegidos e em conformidade com a LGPD
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:justify-self-end">
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}

/** Preview ilustrativo do app (mockup em CSS — substituível por screenshot real). */
function HeroPreview() {
  return (
    <div className="relative w-full max-w-md">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <span className="size-3 rounded-full bg-destructive/60" />
          <span className="size-3 rounded-full bg-secondary" />
          <span className="size-3 rounded-full bg-primary/60" />
          <span className="ml-2 text-xs text-muted-foreground">
            Avaliação de Dependência Digital
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Rodrigo M. Prado</p>
              <p className="text-xs text-muted-foreground">Escala CARS · 11 itens</p>
            </div>
            <span className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold text-primary">
              Risco moderado
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: "CARS", value: 72 },
              { label: "UCLA", value: 48 },
              { label: "SPI", value: 61 },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{row.label}</span>
                  <span>{row.value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Evolução (últimas avaliações)
            </p>
            <div className="mt-3 flex items-end gap-1.5">
              {[40, 52, 48, 63, 58, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/70"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
