import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { QuestionnairePatientsTable } from "@/features/questionnaires/components/questionnaire-patients-table";
import { QuestionnaireQuestionsDialog } from "@/features/questionnaires/components/questionnaire-questions-dialog";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { getScaleDisplayName } from "@/lib/scales";
import { formatDate } from "@/lib/utils";

interface AvaliacaoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AvaliacaoDetailPage({ params }: AvaliacaoDetailPageProps) {
  const session = await requireRole("PSYCHOLOGIST");
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

  const scales = Array.from(new Set(questionnaire.questions.map((q) => q.scale.name)));

  return (
    <div>
      <PageHeader
        title={questionnaire.title}
        description={`Criado em ${formatDate(questionnaire.created_at)}`}
        actions={<QuestionnaireQuestionsDialog questions={questionnaire.questions} />}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={questionnaire.active ? "default" : "secondary"}>
          {questionnaire.active ? "Ativo" : "Inativo"}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <ClipboardList className="size-3.5" />
          {questionnaire.questions.length} pergunta(s)
        </Badge>
        {scales.map((scale) => (
          <Badge key={scale} variant="outline" className="px-3 py-1 text-xs">
            {getScaleDisplayName(scale)}
          </Badge>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Quem respondeu</h2>
      <QuestionnairePatientsTable questionnaireId={questionnaireId} />
    </div>
  );
}
