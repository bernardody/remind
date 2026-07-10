import { z } from "zod";

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
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  phone: z.string().min(8, "Informe um telefone válido"),
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
  phone: z.string().min(8, "Informe um telefone válido"),
  birthDate: z.string().min(1, "Informe a data de nascimento"),
  gender: z.string().length(1, "Selecione o gênero"),
});
export type UpdatePatientRequest = z.infer<typeof UpdatePatientRequestSchema>;
