"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  GOOGLE_LOGIN_ENABLED,
  GoogleSignInButton,
} from "@/features/auth/components/google-sign-in-button";
import { LoginRequestSchema, type LoginRequest } from "@/features/auth/schemas";
import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginRequest) {
    setFormError(null);

    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    // `code` vem de `ServerUnavailableError` (lib/auth/config.ts) — só
    // diferencia "servidor fora do ar" de "credencial errada"; nunca revela
    // se o email existe (mesma rede de segurança de antes, PRD.md §5.3).
    if (!result || result.error) {
      setFormError(
        result?.code === "server-unavailable"
          ? "Não conseguimos conectar. Tente novamente em instantes."
          : "Email ou senha inválidos.",
      );
      return;
    }

    const session = await getSession();
    const type = session?.user.type;
    const callbackUrl = searchParams.get("callbackUrl");
    router.push(
      callbackUrl ?? (type ? HOME_BY_USER_TYPE[type] : ROUTES.home),
    );
    router.refresh();
  }

  const handleGoogleError = useCallback((message: string) => {
    setFormError(message);
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href={ROUTES.home}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao site
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Entrar
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acesse com o email e senha cadastrados.
          </p>
        </div>
      </div>

      {/* Reveal (altura/opacidade) e shake ficam em elementos separados —
          animar os dois juntos na mesma transição competia visualmente e
          deixava o estado de erro difícil de acompanhar. */}
      <AnimatePresence>
        {formError && (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { x: [0, -6, 6, -3, 3, 0] }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
              role="alert"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {GOOGLE_LOGIN_ENABLED && (
        <>
          <GoogleSignInButton onError={handleGoogleError} />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou entre com email</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="voce@clinica.com"
                    autoComplete="username"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Senha</FormLabel>
                  <Link
                    href={ROUTES.esqueciSenha}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-11"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    tabIndex={-1}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? "hide" : "show"}
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            isLoading={form.formState.isSubmitting}
          >
            Entrar
          </Button>
        </form>
      </Form>
    </div>
  );
}
