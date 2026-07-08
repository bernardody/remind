import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function AvaliacoesPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Avaliações"
        description="Questionários disponíveis e quem já respondeu."
      />
      <EmptyState
        icon={ClipboardList}
        title="Em construção"
        description="A lista de questionários e o detalhe de respostas/resultado chegam na próxima parte (Fase 3)."
      />
    </div>
  );
}
