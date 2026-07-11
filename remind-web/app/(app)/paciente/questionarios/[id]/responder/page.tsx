import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { QuestionnaireWizard } from "@/features/questionnaires/components/wizard/questionnaire-wizard";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

interface ResponderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResponderPage({ params }: ResponderPageProps) {
  const session = await requireRole("PATIENT");
  const { id } = await params;
  const questionnaireId = Number(id);

  let questionnaire: QuestionnaireDetail;
  try {
    questionnaire = await apiFetch<QuestionnaireDetail>(`/questionarios/${questionnaireId}`, {
      token: session.accessToken,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Checagem no servidor (além do 409 no envio) — sem isso o paciente conseguia
  // abrir o wizard e marcar tudo de novo, só sendo barrado ao clicar em enviar.
  const alreadyAnswered = await apiFetch(`/questionarios/${questionnaireId}/resultado`, {
    token: session.accessToken,
  })
    .then(() => true)
    .catch((err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      throw err;
    });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={questionnaire.title} description="Responda com calma, no seu tempo." />
      {alreadyAnswered ? (
        <EmptyState
          icon={CircleCheck}
          title="Questionário já respondido"
          description="Você já enviou suas respostas pra esta avaliação."
          action={
            <Button asChild>
              <Link href={ROUTES.paciente.inicio}>Voltar ao início</Link>
            </Button>
          }
        />
      ) : (
        <QuestionnaireWizard questionnaire={questionnaire} />
      )}
    </div>
  );
}
