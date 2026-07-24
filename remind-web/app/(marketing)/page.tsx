import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { ImpactBand } from "@/components/marketing/impact-band";
import { Challenge } from "@/components/marketing/challenge";
import { Solution } from "@/components/marketing/solution";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { AppShowcase } from "@/components/marketing/app-showcase";
import { DemoForm } from "@/components/marketing/demo-form";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} · ${SITE.tagline}`,
  description: SITE.description,
  keywords: [
    "dependência digital",
    "avaliação psicológica",
    "escalas psicométricas",
    "psicologia clínica",
    "saúde mental",
    "uso problemático de redes sociais",
    "triagem de dependência digital",
  ],
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ImpactBand />
      <Challenge />
      <Solution />
      <HowItWorks />
      <Features />
      <AppShowcase />
      <DemoForm />
    </>
  );
}
