"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, MailCheck } from "lucide-react";

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
import { useForgotPassword } from "@/features/auth/api";
import {
  ForgotPasswordRequestSchema,
  type ForgotPasswordRequest,
} from "@/features/auth/schemas";
import { ROUTES } from "@/lib/constants";

/**
 * `POST /auth/forgot-password` sempre responde 200 (nunca revela se o e-mail existe) — por
 * isso a tela mostra uma única mensagem de sucesso genérica, independente do resultado real.
 */
export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordRequest) {
    await forgotPassword.mutateAsync(values).catch(() => {
      // Erro de rede/servidor: mesmo assim mostra a mensagem genérica — não
      // há nada de sensível a diferenciar aqui do lado do usuário.
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Verifique seu e-mail
        </h2>
        <p className="text-sm text-muted-foreground">
          Se esse e-mail estiver cadastrado, você vai receber um link para
          definir uma nova senha em alguns minutos.
        </p>
        <Link
          href={ROUTES.login}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href={ROUTES.login}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao login
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Esqueci minha senha
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Informe seu e-mail cadastrado e enviaremos um link para definir uma nova senha.
          </p>
        </div>
      </div>

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

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            isLoading={form.formState.isSubmitting}
          >
            Enviar link de redefinição
          </Button>
        </form>
      </Form>
    </div>
  );
}
