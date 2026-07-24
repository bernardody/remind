import { Card, CardContent } from "@/components/ui/card";
import type { UserType } from "@/features/auth/schemas";

const TYPE_LABEL: Record<UserType, string> = {
  PSYCHOLOGIST: "Psicólogo(a)",
  PATIENT: "Paciente",
};

interface ProfileCardProps {
  name: string;
  email: string;
  type: UserType;
}

/**
 * RF-20 — dados do usuário logado, mesmo componente pros dois perfis
 * (psicólogo/paciente, ver `app/(app)/{psicologo,paciente}/perfil/page.tsx`).
 * Vêm do JWT (sem `GET /me` no backend ainda, ver Spec 04 §2); troca de fonte
 * fica isolada aqui quando existir — o mesmo vale pra edição/troca de senha,
 * que dependem de endpoint ainda inexistente (PRD.md §5.11).
 */
export function ProfileCard({ name, email, type }: ProfileCardProps) {
  const fields = [
    { label: "Nome", value: name || "-" },
    { label: "Email", value: email || "-" },
    { label: "Perfil", value: TYPE_LABEL[type] },
  ];

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between px-6 py-4"
            >
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <span className="text-sm font-medium text-foreground">
                {field.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
