"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ROUTES } from "@/lib/constants";

interface AdminHeaderProps {
  userEmail: string;
}

/** Header mínimo da área admin — sem sidebar/nav (uma única tela: cadastrar psicólogo). */
export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <Logo symbolSize={26} textClassName="text-base" />
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:block">{userEmail}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: ROUTES.login })}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
