import { z } from "zod";

/**
 * Schema compartilhado entre o formulário (`demo-form.tsx`) e o Route Handler
 * (`/api/leads`). Validação única em cliente e servidor.
 */
export const leadSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("E-mail inválido."),
  telefone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .max(30, "Telefone muito longo."),
  clinica: z.string().trim().max(120).optional().or(z.literal("")),
  mensagem: z
    .string()
    .trim()
    .max(1000, "Mensagem muito longa.")
    .optional()
    .or(z.literal("")),
  /** Honeypot anti-spam — deve ficar vazio. */
  website: z.string().max(0).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
