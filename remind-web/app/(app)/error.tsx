"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { TriangleAlert } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const home = session ? HOME_BY_USER_TYPE[session.user.type] : ROUTES.home;

  return (
    <ErrorPage
      icon={TriangleAlert}
      eyebrow="Erro inesperado"
      title="Não foi possível carregar essa página"
      description="Algo deu errado. Tente novamente ou volte ao início."
      primaryAction={{ label: "Tentar novamente", onClick: () => reset() }}
      secondaryAction={{ label: "Voltar ao início", href: home }}
    />
  );
}
