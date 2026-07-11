import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { PatientInfoCard } from "@/features/patients/components/patient-info-card";
import { PatientQuestionnairesTable } from "@/features/patients/components/patient-questionnaires-table";
import type { Patient, PatientQuestionnaire } from "@/features/patients/schemas";
import type { PatientResult } from "@/features/results/schemas";
import { apiFetch, apiFetchPage } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { getRiskBand, ROUTES } from "@/lib/constants";
import { formatDate, formatRelativeDate } from "@/lib/utils";

interface PacienteDetailPageProps {
  params: Promise<{ id: string }>;
}

const RECENT_ANSWERS_SAMPLE = 5;

export default async function PacienteDetailPage({ params }: PacienteDetailPageProps) {
  const session = await requireRole("PSYCHOLOGIST");
  const { id } = await params;
  const patientId = Number(id);

  let patient: Patient;
  try {
    patient = await apiFetch<Patient>(`/pacientes/${patientId}`, {
      token: session.accessToken,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Sem endpoint de "resumo do paciente" no backend — agrega no frontend a
  // partir de `/pacientes/{id}/avaliacoes` (amostra recente, não pagina até
  // o fim) + `/resultado` da mais recente, pra mostrar algo além de dados
  // cadastrais sem esperar a Fase 5b (PRD.md §5.6).
  const answeredPage = await apiFetchPage<PatientQuestionnaire>(
    `/pacientes/${patientId}/avaliacoes`,
    { size: RECENT_ANSWERS_SAMPLE },
    { token: session.accessToken },
  );

  const mostRecent = [...answeredPage.content].sort((a, b) =>
    a.answeredAt < b.answeredAt ? 1 : -1,
  )[0];

  let recentResult: PatientResult | null = null;
  if (mostRecent) {
    try {
      recentResult = await apiFetch<PatientResult>(
        `/questionarios/${mostRecent.questionnaireId}/pacientes/${patientId}/resultado`,
        { token: session.accessToken },
      );
    } catch {
      recentResult = null;
    }
  }

  const recentBand = recentResult ? getRiskBand(recentResult.average) : null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={ROUTES.psicologo.pacientes}>Pacientes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{patient.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={patient.name}
        description={`Cadastrado em ${formatDate(patient.createdAt)} · ${formatRelativeDate(patient.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <PatientInfoCard patient={patient} className="lg:col-span-1" />

        <Card className="h-fit lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Resumo clínico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avaliações respondidas</span>
              <span className="font-semibold text-foreground">{answeredPage.totalElements}</span>
            </div>

            {mostRecent ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {mostRecent.questionnaireTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(mostRecent.answeredAt)} ·{" "}
                    {formatRelativeDate(mostRecent.answeredAt)}
                  </p>
                </div>
                {recentBand && (
                  <Badge
                    variant="risk"
                    className="shrink-0 px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: recentBand.color, color: recentBand.textColor }}
                  >
                    Risco {recentBand.label.toLowerCase()}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação respondida ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Avaliações respondidas</h2>
        <PatientQuestionnairesTable patientId={patientId} />
      </div>
    </div>
  );
}
