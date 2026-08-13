"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { ErrorPage } from "@/components/shared/error-page";
import { ROUTES } from "@/lib/constants";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      icon={TriangleAlert}
      eyebrow="Erro inesperado"
      title="Não foi possível carregar essa página"
      description="Algo deu errado. Tente novamente em instantes."
      primaryAction={{ label: "Tentar novamente", onClick: () => reset() }}
      secondaryAction={{ label: "Ir para o login", href: ROUTES.login }}
    />
  );
}
