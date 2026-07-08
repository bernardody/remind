import { Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function PacientesPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Lista, cadastro e edição dos seus pacientes."
      />
      <EmptyState
        icon={Users}
        title="Em construção"
        description="A tabela de pacientes com busca, paginação e cadastro chega na próxima parte (Fase 3)."
      />
    </div>
  );
}
