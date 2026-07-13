"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ErrorState } from "@/components/shared/error-state";
import { ROUTES } from "@/lib/constants";

interface ConsumeInviteViewProps {
  token: string;
}

/**
 * Troca o token do convite por uma sessão de paciente de escopo restrito
 * (provider "invite" — lib/auth/config.ts) e redireciona direto ao wizard.
 * Client Component porque `signIn()`/`getSession()` do next-auth/react só
 * funcionam no browser (mesmo padrão de `login-form.tsx`).
 */
export function ConsumeInviteView({ token }: ConsumeInviteViewProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function consume() {
      const result = await signIn("invite", { token, redirect: false });
      if (cancelled) return;

      if (!result || result.error) {
        setError(
          result?.code === "server-unavailable"
            ? "Não conseguimos conectar. Tente novamente em instantes."
            : (result?.code ?? "Não foi possível validar este convite."),
        );
        return;
      }

      const session = await getSession();
      if (cancelled) return;

      if (session?.user.questionnaireId) {
        router.replace(ROUTES.paciente.responder(session.user.questionnaireId));
        return;
      }

      setError("Não foi possível continuar. Tente novamente em instantes.");
    }

    void consume();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-12">
      <Logo />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {error ? (
          <ErrorState title="Não foi possível abrir o convite" description={error} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Validando seu convite…</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
