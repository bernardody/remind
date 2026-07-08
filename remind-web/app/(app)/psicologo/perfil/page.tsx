import { PageHeader } from "@/components/layout/page-header";
import { ProfileCard } from "@/features/auth/components/profile-card";
import { requireRole } from "@/lib/auth/session";

export default async function PsicologoPerfilPage() {
  const session = await requireRole("PSYCHOLOGIST");

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
