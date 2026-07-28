import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { PageHeader } from "@/components/marketing/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE, ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do ReMind ou solicite uma demonstração.",
  keywords: [
    "demonstração ReMind",
    "contato ReMind",
    "software para psicólogos",
  ],
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a gente"
        description="Quer ver o ReMind na prática ou tirar dúvidas? Estamos à disposição."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-3xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          <Card className="p-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">E-mail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dúvidas gerais, parcerias ou suporte.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {SITE.email}
            </a>
          </Card>

          <Card className="p-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">Telefone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fale diretamente com nossa equipe.
            </p>
            <a
              href={SITE.phoneHref}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {SITE.phone}
            </a>
          </Card>
        </div>

        <div className="mx-auto mt-10 max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-muted-foreground">
            Prefere ver a plataforma funcionando? Solicite uma demonstração
            guiada.
          </p>
          <Button className="mt-4" asChild>
            <Link href={ROUTES.home + ROUTES.demoAnchor}>
              Solicitar demonstração
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
