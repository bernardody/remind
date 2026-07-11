import { PageHeader } from "@/components/layout/page-header";
import { MyAnsweredQuestionnaires } from "@/features/questionnaires/components/my-answered-questionnaires";
import { requireRole } from "@/lib/auth/session";

export default async function PacienteResultadosPage() {
  await requireRole("PATIENT");

  return (
    <div>
      <PageHeader title="Resultados" description="Seu histórico de avaliações respondidas." />
      <MyAnsweredQuestionnaires />
    </div>
  );
}
