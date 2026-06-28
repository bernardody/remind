import type { Metadata } from "next";

import { PageHeader } from "@/components/marketing/page-header";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o ReMind coleta, usa e protege dados pessoais e dados sensíveis de saúde, em conformidade com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Política de Privacidade"
        description="Última atualização: junho de 2026."
      />

      <article className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            ⚠️ Texto provisório, a ser revisado juridicamente antes da
            publicação em produção.
          </p>

          <section className="flex flex-col gap-3">
            <h2>1. Quem somos</h2>
            <p>
              O {SITE.name} é uma plataforma clínica destinada a psicólogos para
              avaliação e monitoramento do uso problemático de redes sociais.
              Para questões de privacidade, contate {SITE.email}.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>2. Dados que coletamos</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Dados de cadastro de profissionais (nome, e-mail, telefone).</li>
              <li>
                Dados de pacientes inseridos pelo profissional e respostas aos
                questionários (dados sensíveis de saúde).
              </li>
              <li>Dados de contato enviados via formulário de demonstração.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2>3. Base legal e finalidade (LGPD)</h2>
            <p>
              Tratamos dados pessoais para prestação do serviço, com base no
              consentimento e na tutela da saúde. Dados sensíveis são tratados
              exclusivamente para a finalidade clínica indicada pelo
              profissional responsável.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>4. Compartilhamento e segurança</h2>
            <p>
              Não vendemos dados pessoais. Adotamos medidas técnicas e
              organizacionais (criptografia em trânsito, controle de acesso)
              para proteger as informações.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2>5. Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção, portabilidade ou eliminação
              dos seus dados, bem como revogar consentimento, pelo e-mail{" "}
              {SITE.email}.
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
