import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Patient } from "@/features/patients/schemas";
import { formatDate } from "@/lib/utils";

const GENDER_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino" };

/** RF-14/RF-16 — dados cadastrais do paciente na tela de perfil individual. */
export function PatientInfoCard({ patient }: { patient: Patient }) {
  const fields = [
    { label: "Email", value: patient.email },
    { label: "Telefone", value: patient.phone },
    { label: "Nascimento", value: formatDate(patient.birthDate) },
    { label: "Gênero", value: GENDER_LABEL[patient.gender] ?? patient.gender },
  ];

  return (
    <Card className="max-w-md">
      <CardContent className="flex flex-col divide-y divide-border p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={patient.active ? "default" : "secondary"}>
            {patient.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground">{field.label}</span>
            <span className="text-sm font-medium text-foreground">{field.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
