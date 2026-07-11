"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { PATIENT_NAV, PSYCHOLOGIST_NAV } from "@/lib/constants";
import type { UserType } from "@/features/auth/schemas";

interface SidebarNavProps {
  userType: UserType;
  /** Fecha o sheet mobile ao navegar. */
  onNavigate?: () => void;
}

export function SidebarNav({ userType, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = userType === "PSYCHOLOGIST" ? PSYCHOLOGIST_NAV : PATIENT_NAV;

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegação principal">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {item.label}
            </span>
            {item.badge && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
