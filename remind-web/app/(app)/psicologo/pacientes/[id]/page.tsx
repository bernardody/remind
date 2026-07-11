import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { PatientInfoCard } from "@/features/patients/components/patient-info-card";
import { PatientQuestionnairesTable } from "@/features/patients/components/patient-questionnaires-table";
import type { Patient } from "@/features/patients/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

interface PacienteDetailPageProps {
  params: Promise<{ id: string }>;
}

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={patient.name}
        description={`Cadastrado em ${formatDate(patient.createdAt)}`}
      />

      <PatientInfoCard patient={patient} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Avaliações respondidas</h2>
        <PatientQuestionnairesTable patientId={patientId} />
      </div>
    </div>
  );
}
