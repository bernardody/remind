import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false },
};

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
