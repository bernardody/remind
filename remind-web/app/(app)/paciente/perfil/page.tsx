import { PageHeader } from "@/components/layout/page-header";
import { ProfileCard } from "@/features/auth/components/profile-card";
import { requireRole } from "@/lib/auth/session";

export default async function PacientePerfilPage() {
  const session = await requireRole("PATIENT");

  return (
    <div>
      <PageHeader title="Perfil" description="Seus dados de acesso." />
      <ProfileCard
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        type={session.user.type}
      />
    </div>
  );
}
