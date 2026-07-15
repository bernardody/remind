import { PageHeader } from "@/components/layout/page-header";
import { CompleteProfileForm } from "@/features/auth/components/complete-profile-form";
import { requireRole } from "@/lib/auth/session";

export default async function CompletarPerfilPage() {
  await requireRole("PSYCHOLOGIST");

  return (
    <div>
      <PageHeader
        title="Complete seu perfil"
        description="Precisamos de mais alguns dados antes de liberar o acesso completo à plataforma."
      />
      <CompleteProfileForm />
    </div>
  );
}
