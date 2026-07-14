"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ErrorState } from "@/components/shared/error-state";
import { ROUTES } from "@/lib/constants";

interface ConsumeInviteViewProps {
  token: string;
}

type Step = "loading" | "confirm-switch" | "error";

/**
 * Troca o token do convite por uma sessão de paciente de escopo restrito
 * (provider "invite" — lib/auth/config.ts) e redireciona direto ao wizard.
 * Client Component porque `signIn()`/`getSession()` do next-auth/react só
 * funcionam no browser (mesmo padrão de `login-form.tsx`).
 *
 * NextAuth mantém um único cookie de sessão por navegador (não por aba). Se
 * já existir uma sessão de psicólogo ativa neste navegador, trocar direto sem
 * avisar a encerraria silenciosamente — o psicólogo perde a própria sessão ao
 * só clicar no link pra conferir. Por isso, nesse caso, pedimos confirmação
 * antes de consumir o convite; para qualquer outra situação (sem sessão, ou
 * sessão de paciente), consome direto, como antes.
 */
export function ConsumeInviteView({ token }: ConsumeInviteViewProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);

  const consume = useCallback(async () => {
    setStep("loading");
    const result = await signIn("invite", { token, redirect: false });

    if (!result || result.error) {
      setError(
        result?.code === "server-unavailable"
          ? "Não conseguimos conectar. Tente novamente em instantes."
          : (result?.code ?? "Não foi possível validar este convite."),
      );
      setStep("error");
      return;
    }

    const session = await getSession();

    if (session?.user.questionnaireId) {
      router.replace(ROUTES.paciente.responder(session.user.questionnaireId));
      return;
    }

    setError("Não foi possível continuar. Tente novamente em instantes.");
    setStep("error");
  }, [token, router]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const existing = await getSession();
      if (cancelled) return;

      if (existing?.user.type === "PSYCHOLOGIST") {
        setStep("confirm-switch");
        return;
      }

      void consume();
    }

    void start();

    return () => {
      cancelled = true;
    };
  }, [consume]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-12">
      <Logo />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {step === "error" && error ? (
          <ErrorState title="Não foi possível abrir o convite" description={error} />
        ) : step === "confirm-switch" ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Este navegador está com uma sessão de psicólogo(a) aberta. Para abrir
              este convite como paciente, essa sessão será encerrada.
            </p>
            <Button onClick={() => void consume()} className="w-full">
              Continuar como paciente
            </Button>
          </div>
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
