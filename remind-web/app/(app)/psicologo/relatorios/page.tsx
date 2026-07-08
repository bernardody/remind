import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function RelatoriosPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Evolução longitudinal e comparativos por escala."
      />
      <EmptyState
        icon={BarChart3}
        title="Em breve"
        description="Condicionado a dados do backend — chega na Fase 5, junto dos gráficos de analytics."
      />
    </div>
  );
}
