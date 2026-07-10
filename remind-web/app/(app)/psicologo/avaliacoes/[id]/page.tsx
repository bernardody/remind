import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { QuestionnairePatientsTable } from "@/features/questionnaires/components/questionnaire-patients-table";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
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
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={questionnaire.active ? "default" : "secondary"}>
          {questionnaire.active ? "Ativo" : "Inativo"}
        </Badge>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          <ClipboardList className="size-3.5" />
          {questionnaire.questions.length} pergunta(s)
        </span>
        {scales.map((scale) => (
          <span
            key={scale}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {scale}
          </span>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Quem respondeu</h2>
      <QuestionnairePatientsTable questionnaireId={questionnaireId} />
    </div>
  );
}
