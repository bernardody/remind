"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";

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
import { LoginRequestSchema, type LoginRequest } from "@/features/auth/schemas";
import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          Entrar
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Acesse com o email e senha cadastrados.
        </p>
      </div>

      <AnimatePresence>
        {formError && (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              x: [0, -6, 6, -4, 4, 0],
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-start gap-2 overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                <FormLabel>Senha</FormLabel>
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
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
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
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Entrar
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.home}
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Voltar ao site
        </Link>
      </p>
    </div>
  );
}
