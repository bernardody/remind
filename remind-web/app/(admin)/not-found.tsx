import { FileQuestion } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { ROUTES } from "@/lib/constants";

export default function AdminNotFound() {
  return (
    <ErrorPage
      icon={FileQuestion}
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="Esse endereço não existe dentro do painel administrativo."
      primaryAction={{ label: "Voltar aos psicólogos", href: ROUTES.admin.psicologos }}
    />
  );
}
