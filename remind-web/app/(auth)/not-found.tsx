import { FileQuestion } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { ROUTES } from "@/lib/constants";

export default function AuthNotFound() {
  return (
    <ErrorPage
      icon={FileQuestion}
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="Esse endereço não existe. Volte para o login."
      primaryAction={{ label: "Ir para o login", href: ROUTES.login }}
    />
  );
}
