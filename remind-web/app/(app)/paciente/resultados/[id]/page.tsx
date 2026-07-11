import { notFound } from "next/navigation";

import { Gauge } from "@/components/charts/gauge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { PatientResult } from "@/features/results/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

interface ResultadoPageProps {
  params: Promise<{ id: string }>;
}

export default async function PacienteResultadoPage({ params }: ResultadoPageProps) {
  const session = await requireRole("PATIENT");
  const { id } = await params;
  const questionnaireId = Number(id);

  let result: PatientResult;
  try {
    result = await apiFetch<PatientResult>(`/questionarios/${questionnaireId}/resultado`, {
      token: session.accessToken,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={result.questionnaireTitle}
        description={`Respondido em ${formatDateTime(result.answeredAt)}`}
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {/* Resultado é só uma média global (PRD §3 dep. #4) — sem breakdown por escala ainda. */}
          <Gauge value={result.average} />
        </CardContent>
      </Card>
    </div>
  );
}
