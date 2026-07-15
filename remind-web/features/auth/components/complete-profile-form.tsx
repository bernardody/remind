"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { useCompleteProfile } from "@/features/auth/api";
import {
  CompleteProfileRequestSchema,
  type CompleteProfileRequest,
} from "@/features/auth/schemas";
import { ApiError } from "@/lib/api/types";
import { ROUTES } from "@/lib/constants";
import { maskCEP, maskCPF, maskPhone, onlyDigits } from "@/lib/masks";

/**
 * `PUT /psychologists/me/profile` (spec 001-login-google-psicologo) — única
 * tela acessível a um psicólogo com `profileComplete=false` (redirecionado
 * pra cá pelo middleware). Depois de concluir, atualiza a sessão via
 * `update()` (Auth.js, ver `lib/auth/config.ts`) sem exigir novo login.
 */
export function CompleteProfileForm() {
  const router = useRouter();
  const { update } = useSession();
  const completeProfile = useCompleteProfile();

  const form = useForm<CompleteProfileRequest>({
    resolver: zodResolver(CompleteProfileRequestSchema),
    defaultValues: {
      cpf: "",
      phone: "",
      street: "",
      number: "",
      cep: "",
      neighborhood: "",
      city: "",
    },
  });

  async function onSubmit(values: CompleteProfileRequest) {
    try {
      await completeProfile.mutateAsync(values);
      await update({ profileComplete: true });
      toast.success("Perfil concluído.");
      router.push(ROUTES.psicologo.dashboard);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível concluir o perfil.",
      );
    }
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        {...field}
                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        {...field}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        {...field}
                        onChange={(e) => field.onChange(onlyDigits(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem className="sm:max-w-[10rem]">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="00000-000"
                      maxLength={9}
                      {...field}
                      onChange={(e) => field.onChange(maskCEP(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full sm:w-fit"
              isLoading={form.formState.isSubmitting}
            >
              Concluir cadastro
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
