import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { ROUTES } from "@/lib/constants";

/** RF-02 — Hero: foto de fundo com overlay escuro, headline, subtítulo e CTAs. */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[620px] items-center overflow-hidden pt-28 pb-16 sm:min-h-[680px] sm:pt-36 sm:pb-24"
    >
      {/* foto de fundo — coloque em public/hero-bg.jpg */}
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* overlay gradiente: grafite opaco na esq, semi-transparente na dir */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(28,43,43,0.93) 0%, rgba(28,43,43,0.80) 40%, rgba(28,43,43,0.45) 70%, rgba(28,43,43,0.20) 100%)",
        }}
      />

      {/* conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              <Sparkles className="size-4" />
              Avaliação clínica de dependência digital
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              A primeira plataforma de avaliação de{" "}
              <span className="text-mist">dependência digital</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/80">
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
              <Button
                size="lg"
                variant="outline"
                className="border-white/60 text-white hover:border-white hover:bg-white/10"
                asChild
              >
                <Link href="#como-funciona">
                  <PlayCircle className="size-4" />
                  Ver como funciona
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="flex items-center gap-2 text-sm text-white/60">
              <ShieldCheck className="size-4 text-mist" />
              Dados protegidos e em conformidade com a LGPD
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
