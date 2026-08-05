import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("ADMIN");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader userEmail={session.user.email ?? ""} />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
