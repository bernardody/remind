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
      // docs/specs/002-convite-questionario §16/§20) OU psicólogo com perfil
      // incompleto (spec 001-login-google-psicologo) — em ambos os casos o
      // backend bloqueia (403) as demais rotas, então a navegação lateral
      // quebraria a aplicação se aparecesse aqui.
      restricted={
        !!session.user.questionnaireId ||
        (session.user.type === "PSYCHOLOGIST" && !session.user.profileComplete)
      }
    >
      {children}
    </AppShell>
  );
}
