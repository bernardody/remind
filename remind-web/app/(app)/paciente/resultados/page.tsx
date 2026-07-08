import { LineChart } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function PacienteResultadosPage() {
  await requireRole("PATIENT");

  return (
    <div>
      <PageHeader
        title="Resultados"
        description="Seu histórico de avaliações respondidas."
      />
      <EmptyState
        icon={LineChart}
        title="Em breve"
        description="Depende de endpoints escopados ao paciente ainda não disponíveis no backend (ver Spec 04 §5)."
      />
    </div>
  );
}
