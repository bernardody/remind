"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { leadSchema, type LeadInput } from "@/lib/leads/schema";

/** RF-09 — CTA final + formulário "Solicitar Agendamento" (captura de lead). */
export function DemoForm() {
  const [enviado, setEnviado] = useState(false);

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      clinica: "",
      mensagem: "",
      website: "",
    },
  });

  async function onSubmit(values: LeadInput) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      setEnviado(true);
      form.reset();
      toast.success("Solicitação enviada! Entraremos em contato em breve.");
    } catch {
      toast.error("Não foi possível enviar. Tente novamente em instantes.");
    }
  }

  return (
    <section id="agendamento" className="scroll-mt-20 bg-primary py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="text-primary-foreground">
          <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Solicitar demonstração
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Veja o ReMind funcionando no seu fluxo de trabalho
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            30 minutos. Sem compromisso. Mostramos na prática como as escalas do
            ReMind resolvem a sua rotina de análise e economizam seu tempo de
            triagem.
          </p>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
          {enviado ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-8" />
              </span>
              <h3 className="text-2xl font-semibold">Solicitação recebida!</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Obrigado pelo interesse. Nossa equipe entrará em contato pelo
                e-mail informado para agendar sua demonstração.
              </p>
              <Button variant="outline" onClick={() => setEnviado(false)}>
                Enviar nova solicitação
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="voce@clinica.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            autoComplete="tel"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clinica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Clínica / consultório{" "}
                        <span className="font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da clínica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mensagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mensagem{" "}
                        <span className="font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Conte um pouco sobre sua rotina clínica."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* honeypot anti-spam (oculto) */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  {...form.register("website")}
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
                  Solicitar agendamento
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Ao enviar, você concorda com nossa{" "}
                  <a href="/privacidade" className="underline">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </form>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
}
