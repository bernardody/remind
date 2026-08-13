import { Compass } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <ErrorPage
      icon={Compass}
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi movido."
      primaryAction={{ label: "Voltar ao início", href: ROUTES.home }}
      fullScreen
    />
  );
}
