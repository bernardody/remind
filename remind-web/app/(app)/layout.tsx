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
    >
      {children}
    </AppShell>
  );
}
