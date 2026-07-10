import { PageHeader } from "@/components/layout/page-header";
import { QuestionnairesView } from "@/features/questionnaires/components/questionnaires-view";
import { requireRole } from "@/lib/auth/session";

export default async function AvaliacoesPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Avaliações"
        description="Questionários disponíveis e quem já respondeu."
      />
      <QuestionnairesView />
    </div>
  );
}
