import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { ProfileCard } from "@/features/auth/components/profile-card";
import { requireRole } from "@/lib/auth/session";

export default async function PsicologoPerfilPage() {
  const session = await requireRole("PSYCHOLOGIST");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader title="Perfil" description="Seus dados de acesso." />
        <ProfileCard
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          type={session.user.type}
        />
      </div>
      <ChangePasswordForm />
    </div>
  );
}
