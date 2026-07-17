import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { QuestionnaireWizard } from "@/features/questionnaires/components/wizard/questionnaire-wizard";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import type { PatientInvite } from "@/features/invites/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError, type Page } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

interface ResponderPageProps {
  params: Promise<{ id: string }>;
}

/**
 * `status` só reflete transições explícitas — expiração é checada dinamicamente contra
 * `expiresAt` (mesma regra de `available-questionnaires.tsx`).
 */
function isLive(invite: PatientInvite): boolean {
  return (
    (invite.status === "PENDING" || invite.status === "SENT" || invite.status === "OPENED") &&
    new Date(invite.expiresAt).getTime() > Date.now()
  );
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

  // Convite vivo é obrigatório pra responder, inclusive na 1ª vez (docs/specs/
  // 003-relatorios-evolucao-longitudinal/PRD.md §3/§4.1) — checagem no servidor (além do gate
  // no envio) evita abrir o wizard pra só barrar ao clicar em enviar. Não usa mais
  // `/resultado` pra decidir "já respondido": esse endpoint continua 200 pra sempre depois da
  // 1ª resposta, mesmo quando o psicólogo reaplica (mesmo `Questionnaire.id`, convite novo) —
  // quem decide se dá pra responder agora é o estado do convite, não o histórico de respostas.
  const invites = await apiFetch<Page<PatientInvite>>("/questionarios/convites", {
    token: session.accessToken,
    params: { size: 200 },
  });
  const invite = invites.content.find((i) => i.questionnaireId === questionnaireId);

  if (!invite) notFound();

  const alreadyAnswered = invite.status === "ANSWERED";
  const canAnswer = isLive(invite);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={questionnaire.title} description="Responda com calma, no seu tempo." />
      {!canAnswer ? (
        <EmptyState
          icon={CircleCheck}
          title={alreadyAnswered ? "Questionário já respondido" : "Convite indisponível"}
          description={
            alreadyAnswered
              ? "Você já enviou suas respostas pra esta avaliação."
              : "Este convite expirou ou não está mais disponível. Peça um novo ao seu psicólogo."
          }
          action={
            <Button asChild>
              <Link href={ROUTES.paciente.inicio}>Voltar ao início</Link>
            </Button>
          }
        />
      ) : (
        <QuestionnaireWizard questionnaire={questionnaire} inviteId={invite.id} />
      )}
    </div>
  );
}
