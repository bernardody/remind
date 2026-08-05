"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, TriangleAlert } from "lucide-react";

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
import { useResetPassword } from "@/features/auth/api";
import {
  ResetPasswordRequestSchema,
  type ResetPasswordRequest,
} from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/types";
import { ROUTES } from "@/lib/constants";

/**
 * Lê `?token=` da URL (link recebido por e-mail — `RequestPasswordResetService`, backend).
 * Erros de token (expirado/usado/inexistente) vêm com mensagem pronta do backend
 * (`ResetPasswordService`, status 404/410) — mostrados como estão, sem genericizar (o token já
 * é de posse exclusiva de quem clicou o link, não há risco de enumeração aqui).
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordRequest>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: { token, newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(values: ResetPasswordRequest) {
    setFormError(null);
    try {
      await resetPassword.mutateAsync(values);
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.login), 2000);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Não foi possível redefinir sua senha.",
      );
    }
  }

  if (!token) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Link inválido</h2>
        <p className="text-sm text-muted-foreground">
          Este link de redefinição de senha está incompleto. Solicite um novo.
        </p>
        <Link
          href={ROUTES.esqueciSenha}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Senha redefinida</h2>
        <p className="text-sm text-muted-foreground">
          Sua senha foi atualizada. Redirecionando para o login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          Definir nova senha
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Escolha uma nova senha para sua conta ReMind.
        </p>
      </div>

      {formError && (
        <div
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <span>{formError}</span>
            <Link href={ROUTES.esqueciSenha} className="font-medium underline underline-offset-2">
              Solicitar um novo link
            </Link>
          </div>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar nova senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
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
            Definir senha
          </Button>
        </form>
      </Form>
    </div>
  );
}
