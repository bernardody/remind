import type { ReactNode } from "react";
import Link from "next/link";

import { AuthBrandPanel } from "@/features/auth/components/brand-panel";
import { Logo } from "@/components/brand/logo";
import { ROUTES, SITE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />
      <main className="flex flex-col items-center justify-center gap-10 px-6 py-12 sm:px-10">
        {/* Em mobile o painel de marca (`AuthBrandPanel`) some — sem isso o
            login ficava "nu" (só logo pequeno), sem nenhum contexto de marca
            (PRD.md §5.3). */}
        <Link
          href={ROUTES.home}
          className="flex flex-col items-center gap-2 text-center lg:hidden"
        >
          <Logo symbolSize={36} />
          <span className="max-w-xs text-xs font-medium text-muted-foreground">
            {SITE.tagline}
          </span>
        </Link>
        {children}
      </main>
    </div>
  );
}
