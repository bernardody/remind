import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false },
};

/**
 * Stub de login — a autenticação real (Auth.js + BFF) é entregue na Spec 04.
 * Mantém o link "Login" do header funcional enquanto isso.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo symbolSize={40} textClassName="text-2xl" />
      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Login em breve
        </h1>
        <p className="mt-2 text-muted-foreground">
          A área de acesso para psicólogos e pacientes está em construção. Por
          enquanto, solicite uma demonstração para conhecer a plataforma.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={ROUTES.home + ROUTES.demoAnchor}>
            Solicitar demonstração
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.home}>Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
