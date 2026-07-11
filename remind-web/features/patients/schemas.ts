import { z } from "zod";

// Aceita o usuário digitar com ou sem pontuação, mas envia só dígitos — a
// coluna `phone` no Postgres é VARCHAR(11) (DDD + 8 ou 9 dígitos).
const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido");

/**
 * Contrato real de `/pacientes` (Fase 3). `gender` é `Character` no backend
 * (não um enum) — validado como string de 1 caractere, não restrito a M/F,
 * pra não rejeitar dados existentes que fujam do formulário atual.
 */
export const PatientSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  birthDate: z.string(),
  gender: z.string().length(1),
  createdAt: z.string(),
  active: z.boolean(),
});
export type Patient = z.infer<typeof PatientSchema>;

/**
 * `POST /pacientes` — corpo completo (`InsertPatientRequest` real).
 * `cpf` é aceito aqui mas nunca devolvido em nenhuma resposta do backend.
 */
export const InsertPatientRequestSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
  // Aceita o usuário digitar com ou sem pontuação, mas envia só dígitos —
  // a coluna `cpf` no Postgres é VARCHAR(11), não cabe "123.456.789-00".
  cpf: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11, "CPF inválido"),
  phone: phoneSchema,
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  birthDate: z.string().min(1, "Informe a data de nascimento"),
  gender: z.string().length(1, "Selecione o gênero"),
});
export type InsertPatientRequest = z.infer<typeof InsertPatientRequestSchema>;

/**
 * `PUT /pacientes/{id}` — corpo menor que o de criação (`UpdatePatientRequest`
 * real): sem `email`, `cpf` nem `password`, que o backend não aceita editar.
 */
export const UpdatePatientRequestSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  phone: phoneSchema,
  birthDate: z.string().min(1, "Informe a data de nascimento"),
  gender: z.string().length(1, "Selecione o gênero"),
});
export type UpdatePatientRequest = z.infer<typeof UpdatePatientRequestSchema>;

/** `GET /pacientes/{id}/avaliacoes` (`ListPatientQuestionnaireResponse`). */
export const PatientQuestionnaireSchema = z.object({
  questionnaireId: z.number(),
  questionnaireTitle: z.string(),
  answeredAt: z.string(),
});
export type PatientQuestionnaire = z.infer<typeof PatientQuestionnaireSchema>;
