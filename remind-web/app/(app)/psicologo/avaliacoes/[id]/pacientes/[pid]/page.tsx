import { notFound } from "next/navigation";

import { Gauge } from "@/components/charts/gauge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientAnswers, PatientResult } from "@/features/results/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

interface ResultadoPageProps {
  params: Promise<{ id: string; pid: string }>;
}

export default async function ResultadoPage({ params }: ResultadoPageProps) {
  const session = await requireRole("PSYCHOLOGIST");
  const { id, pid } = await params;
  const questionnaireId = Number(id);
  const patientId = Number(pid);

  let answers: PatientAnswers;
  let result: PatientResult;
  try {
    [answers, result] = await Promise.all([
      apiFetch<PatientAnswers>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/respostas`,
        { token: session.accessToken },
      ),
      apiFetch<PatientResult>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/resultado`,
        { token: session.accessToken },
      ),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={answers.patientName}
        description={`${answers.questionnaireTitle} · respondido em ${formatDateTime(answers.answeredAt)}`}
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {/* Resultado é só uma média global (PRD §3 dep. #4) — sem breakdown por escala ainda. */}
          <Gauge value={result.average} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respostas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {answers.responses.map((response, index) => (
            <div
              key={response.questionId}
              className="flex flex-col gap-1.5 px-6 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {response.questionText}
              </span>
              <span className="ml-7 shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground sm:ml-0">
                {response.chosenOption} · {response.chosenValue}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
