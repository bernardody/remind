import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <AppShell
      userType={session.user.type}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      // Sessão nascida de um convite (escopo restrito a 1 questionário, PRD
      // docs/specs/002-convite-questionario §16/§20) — o backend bloqueia (403)
      // qualquer rota fora do próprio questionário, então "Início"/"Perfil"
      // quebrariam a aplicação se aparecessem aqui.
      restricted={!!session.user.questionnaireId}
    >
      {children}
    </AppShell>
  );
}
