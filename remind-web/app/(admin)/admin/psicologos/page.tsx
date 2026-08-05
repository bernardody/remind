import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { CreatePsychologistForm } from "@/features/admin/components/create-psychologist-form";

export const metadata: Metadata = {
  title: "Cadastrar psicólogo",
  robots: { index: false },
};

export default function AdminPsicologosPage() {
  return (
    <div>
      <PageHeader
        title="Cadastrar psicólogo"
        description="Cria a conta e envia um e-mail para o psicólogo definir a própria senha."
      />
      <CreatePsychologistForm />
    </div>
  );
}
