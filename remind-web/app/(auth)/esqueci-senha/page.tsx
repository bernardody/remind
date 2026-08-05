import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  robots: { index: false },
};

export default function EsqueciSenhaPage() {
  return <ForgotPasswordForm />;
}
