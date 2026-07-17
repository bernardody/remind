import { PageHeader } from "@/components/layout/page-header";
import { ReportsView } from "@/features/results/components/reports-view";
import { requireRole } from "@/lib/auth/session";

interface RelatoriosPageProps {
  searchParams: Promise<{ paciente?: string; questionario?: string }>;
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  await requireRole("PSYCHOLOGIST");
  const { paciente, questionario } = await searchParams;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Evolução longitudinal e comparativos por escala."
      />
      <ReportsView
        initialPatientId={paciente ? Number(paciente) : undefined}
        initialQuestionnaireId={questionario ? Number(questionario) : undefined}
      />
    </div>
  );
}
