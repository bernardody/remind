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
 * RF-20 — dados do usuário logado. Vêm do JWT (sem `GET /me` no backend
 * ainda, ver Spec 04 §2); troca de fonte fica isolada aqui quando existir.
 */
export function ProfileCard({ name, email, type }: ProfileCardProps) {
  const fields = [
    { label: "Nome", value: name || "—" },
    { label: "Email", value: email || "—" },
    { label: "Perfil", value: TYPE_LABEL[type] },
  ];

  return (
    <Card className="max-w-md">
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
  );
}
