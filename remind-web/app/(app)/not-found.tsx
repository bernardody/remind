import { FileQuestion } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { getSession } from "@/lib/auth/session";
import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

export default async function AppNotFound() {
  const session = await getSession();
  const home = session ? HOME_BY_USER_TYPE[session.user.type] : ROUTES.home;

  return (
    <ErrorPage
      icon={FileQuestion}
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="Esse endereço não existe ou você não tem acesso a ele."
      primaryAction={{ label: "Voltar ao início", href: home }}
    />
  );
}
