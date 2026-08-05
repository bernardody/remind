"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreatePsychologist } from "@/features/admin/api";
import {
  CreatePsychologistRequestSchema,
  type CreatePsychologistRequest,
} from "@/features/admin/schemas";
import { ApiError } from "@/lib/api/types";

/**
 * `POST /admin/psychologists` — cria a conta (sem senha) e dispara o e-mail de ativação
 * (mesmo link de "esqueci minha senha", ver `RequestPasswordResetService` no backend).
 * O psicólogo continua completando CPF/telefone/endereço no primeiro acesso, como hoje.
 */
export function CreatePsychologistForm() {
  const createPsychologist = useCreatePsychologist();

  const form = useForm<CreatePsychologistRequest>({
    resolver: zodResolver(CreatePsychologistRequestSchema),
    defaultValues: { name: "", email: "" },
  });

  async function onSubmit(values: CreatePsychologistRequest) {
    try {
      await createPsychologist.mutateAsync(values);
      toast.success("Psicólogo cadastrado. Um e-mail de ativação foi enviado.");
      form.reset();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível cadastrar o psicólogo.",
      );
    }
  }

  return (
    <Card className="max-w-md">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="psicologo@clinica.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="mt-2 w-full sm:w-fit"
              isLoading={form.formState.isSubmitting}
            >
              Cadastrar psicólogo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
