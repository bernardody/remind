import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/marketing/page-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "O ReMind nasceu para dar estrutura e clareza à avaliação clínica da dependência digital.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sobre"
        title="Dar nome ao que o paciente ainda não consegue descrever"
        description="O ReMind é uma plataforma clínica para psicólogos avaliarem e monitorarem o uso problemático de redes sociais em adolescentes e jovens."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 text-base leading-relaxed text-muted-foreground sm:px-6 lg:px-8">
          <p>
            A dependência digital é um fenômeno crescente: mais de 210 milhões
            de pessoas no mundo apresentam comportamentos problemáticos no uso de
            redes sociais. Ainda assim, a psicologia clínica carecia de
            ferramentas próprias para medir, registrar e acompanhar esse quadro
            com rigor.
          </p>
          <p>
            O ReMind digitaliza a triagem: o psicólogo cadastra o paciente,
            envia o questionário, e a plataforma calcula os resultados e
            organiza a evolução ao longo do tempo. O objetivo é devolver
            tempo clínico e tornar visíveis os padrões que a análise manual
            deixa escapar.
          </p>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Nossos princípios
          </h2>
          <ul className="flex flex-col gap-3">
            <li>
              <strong className="text-foreground">Rigor científico.</strong>{" "}
              Triagem própria construída a partir de critérios descritos na
              literatura sobre uso problemático de redes sociais, mas não é a
              aplicação de instrumentos clínicos validados e não substitui
              avaliação profissional formal.
            </li>
            <li>
              <strong className="text-foreground">Clareza antes de densidade.</strong>{" "}
              Um dado importante por vez, com leitura clínica direta.
            </li>
            <li>
              <strong className="text-foreground">Privacidade por padrão.</strong>{" "}
              Dados sensíveis de saúde tratados em conformidade com a LGPD.
            </li>
          </ul>

          <div className="mt-6">
            <Button asChild>
              <Link href={ROUTES.home + ROUTES.demoAnchor}>
                Solicitar demonstração
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
