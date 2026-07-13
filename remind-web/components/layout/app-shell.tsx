"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserType } from "@/features/auth/schemas";
import { HOME_BY_USER_TYPE } from "@/lib/constants";

interface AppShellProps {
  userType: UserType;
  userName: string;
  userEmail: string;
  /**
   * Sessão de escopo restrito (convite de questionário, PRD
   * docs/specs/002-convite-questionario) — sem navegação, só a tela de
   * resposta. Qualquer link de "Início"/"Perfil" bateria numa rota que o
   * backend bloqueia (403) para esse token, quebrando a aplicação.
   */
  restricted?: boolean;
  children: ReactNode;
}

export function AppShell({
  userType,
  userName,
  userEmail,
  restricted = false,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const home = HOME_BY_USER_TYPE[userType];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-graphite lg:flex">
        <div className="flex h-16 items-center px-6">
          {restricted ? (
            <Logo variant="dark" symbolSize={26} textClassName="text-base" />
          ) : (
            <Link href={home}>
              <Logo variant="dark" symbolSize={26} textClassName="text-base" />
            </Link>
          )}
        </div>
        {!restricted && <SidebarNav userType={userType} />}
        <p className="mt-auto p-4 text-[11px] font-light text-white/30">
          © {new Date().getFullYear()} ReMind
        </p>
      </aside>

      {!restricted && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-64 max-w-[80%] gap-0 border-none bg-graphite p-0"
          >
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
            </SheetHeader>
            <div className="flex h-16 items-center px-6">
              <Logo variant="dark" symbolSize={26} textClassName="text-base" />
            </div>
            <SidebarNav
              userType={userType}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          onOpenMobileNav={() => setMobileOpen(true)}
          hideMobileNavButton={restricted}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
