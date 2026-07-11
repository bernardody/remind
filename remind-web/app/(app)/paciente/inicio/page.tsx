import { PageHeader } from "@/components/layout/page-header";
import { AvailableQuestionnaires } from "@/features/questionnaires/components/available-questionnaires";
import { requireRole } from "@/lib/auth/session";

export default async function PacienteInicioPage() {
  const session = await requireRole("PATIENT");
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div>
      <PageHeader
        title="Início"
        description={
          firstName
            ? `Olá, ${firstName}. Aqui estão as avaliações disponíveis pra você responder.`
            : "Avaliações disponíveis pra você responder."
        }
      />
      <AvailableQuestionnaires />
    </div>
  );
}
