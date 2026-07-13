"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";

interface TopbarProps {
  userName: string;
  userEmail: string;
  onOpenMobileNav: () => void;
  /** Sem sheet de navegação pra abrir em sessão de convite (escopo restrito). */
  hideMobileNavButton?: boolean;
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function Topbar({
  userName,
  userEmail,
  onOpenMobileNav,
  hideMobileNavButton = false,
}: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      {hideMobileNavButton ? (
        <span />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Abrir navegação"
        >
          <Menu className="size-5" />
        </Button>
      )}

      <span className="hidden lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials(userName, userEmail)}
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {userName || userEmail}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold text-foreground">
              {userName || "Minha conta"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => signOut({ callbackUrl: ROUTES.login })}
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
