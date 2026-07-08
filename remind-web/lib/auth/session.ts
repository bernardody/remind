import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import type { UserType } from "@/features/auth/schemas";

/** Sessão atual (ou `null`) — wrapper server-side sobre o Auth.js. */
export async function getSession() {
  return auth();
}

/**
 * Exige sessão válida e não expirada (PRD R1: sem refresh, JWT de 10min).
 * Redireciona para `/login` caso contrário — usado nos layouts protegidos.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session || Date.now() > session.expiresAt) {
    redirect("/login");
  }
  return session;
}

/** Exige sessão válida do perfil (`type`) informado; barra perfil errado por rota. */
export async function requireRole(type: UserType) {
  const session = await requireSession();
  if (session.user.type !== type) {
    redirect("/login");
  }
  return session;
}
