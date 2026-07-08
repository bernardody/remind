import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function PacienteInicioPage() {
  await requireRole("PATIENT");

  return (
    <div>
      <PageHeader
        title="Início"
        description="Seus questionários atribuídos e pendentes."
      />
      <EmptyState
        icon={ClipboardList}
        title="Em construção"
        description="A lista de questionários e o wizard de resposta chegam na Fase 4."
      />
    </div>
  );
}
