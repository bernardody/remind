import { PageHeader } from "@/components/layout/page-header";
import { PatientsView } from "@/features/patients/components/patients-view";
import { requireRole } from "@/lib/auth/session";

export default async function PacientesPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Lista, cadastro e edição dos seus pacientes."
      />
      <PatientsView />
    </div>
  );
}
