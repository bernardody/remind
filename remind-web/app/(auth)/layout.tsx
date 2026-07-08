import type { ReactNode } from "react";
import Link from "next/link";

import { AuthBrandPanel } from "@/features/auth/components/brand-panel";
import { Logo } from "@/components/brand/logo";
import { ROUTES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />
      <main className="flex flex-col items-center justify-center gap-10 px-6 py-12 sm:px-10">
        <Link href={ROUTES.home} className="lg:hidden">
          <Logo symbolSize={36} />
        </Link>
        {children}
      </main>
    </div>
  );
}
