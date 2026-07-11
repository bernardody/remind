import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { QuestionnaireWizard } from "@/features/questionnaires/components/wizard/questionnaire-wizard";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";

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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={questionnaire.title} description="Responda com calma, no seu tempo." />
      <QuestionnaireWizard questionnaire={questionnaire} />
    </div>
  );
}
