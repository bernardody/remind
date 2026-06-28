import type { Metadata } from "next";

import { PageHeader } from "@/components/marketing/page-header";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso da plataforma ReMind.",
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Termos de Uso"
        description="Última atualização: junho de 2026."
      />

      <article className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            ⚠️ Texto provisório, a ser revisado juridicamente antes da
            publicação em produção.
          </p>

          <section className="flex flex-col gap-3">
            <h2>1. Aceitação dos termos</h2>
            <p>
              Ao acessar e utilizar o {SITE.name}, você concorda com estes
              Termos de Uso. Caso não concorde, não utilize a plataforma.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>2. Uso da plataforma</h2>
            <p>
              O {SITE.name} destina-se ao uso por profissionais de psicologia no
              exercício de sua atividade clínica. O profissional é responsável
              pela veracidade dos dados inseridos e pelo uso adequado das escalas
              disponibilizadas.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>3. Responsabilidade clínica</h2>
            <p>
              Os resultados gerados são instrumentos de apoio à decisão clínica e
              não substituem o julgamento profissional. A interpretação e a
              conduta terapêutica são de responsabilidade do profissional.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>4. Propriedade intelectual</h2>
            <p>
              A marca, o software e os conteúdos do {SITE.name} são protegidos
              por direitos de propriedade intelectual e não podem ser
              reproduzidos sem autorização.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>5. Contato</h2>
            <p>Dúvidas sobre estes termos: {SITE.email}.</p>
          </section>
        </div>
      </article>
    </>
  );
}
