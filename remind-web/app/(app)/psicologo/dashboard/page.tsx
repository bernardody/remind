import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function PsicologoDashboardPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua prática clínica."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Em construção"
        description="Os cards de pacientes ativos e avaliações recentes chegam na próxima parte (Fase 3)."
      />
    </div>
  );
}
