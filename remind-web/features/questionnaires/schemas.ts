import { z } from "zod";

/**
 * Contrato real de `/questionarios`. O backend é inconsistente: `Scale` e
 * `QuestionResponse` usam campos Java em snake_case (`created_at`,
 * `updated_at`, `order_number`) sem `@JsonProperty`, então o JSON sai
 * snake_case — os schemas replicam isso letra por letra em vez de
 * "corrigir" o nome, pra não mascarar um mismatch se o backend mudar.
 */
export const ScaleSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  active: z.boolean(),
});
export type Scale = z.infer<typeof ScaleSchema>;

export const OptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.number(),
});
export type Option = z.infer<typeof OptionSchema>;

export const QuestionSchema = z.object({
  id: z.number(),
  scale: ScaleSchema,
  text: z.string(),
  order_number: z.number(),
  options: z.array(OptionSchema),
});
export type Question = z.infer<typeof QuestionSchema>;

/** `GET /questionarios` — item de lista (`QuestionnaireResponse` real). */
export const QuestionnaireSchema = z.object({
  id: z.number(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  active: z.boolean(),
});
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;

/** `GET /questionarios/{id}` — detalhe (`GetQuestionnaireResponse` real). */
export const QuestionnaireDetailSchema = QuestionnaireSchema.extend({
  questions: z.array(QuestionSchema),
});
export type QuestionnaireDetail = z.infer<typeof QuestionnaireDetailSchema>;

/** `GET /questionarios/{id}/pacientes` — camelCase (`ListQuestionnairePatientResponse`). */
export const QuestionnairePatientSchema = z.object({
  patientId: z.number(),
  patientName: z.string(),
  answeredAt: z.string(),
});
export type QuestionnairePatient = z.infer<typeof QuestionnairePatientSchema>;

/** `POST /questionarios/{id}/responder` — corpo (`AnswerQuestionnaireRequest` real). */
export const AnswerQuestionnaireRequestSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: z.number(),
        questionOptionId: z.number(),
      }),
    )
    .min(1),
});
export type AnswerQuestionnaireRequest = z.infer<typeof AnswerQuestionnaireRequestSchema>;

/** `POST /questionarios/{id}/responder` — resposta (`AnswerQuestionnaireResponse` real). */
export const AnswerQuestionnaireResponseSchema = z.object({
  id: z.number(),
  patientName: z.string(),
  questionnaireTitle: z.string(),
  totalResponses: z.number(),
  answeredAt: z.string(),
});
export type AnswerQuestionnaireResponse = z.infer<typeof AnswerQuestionnaireResponseSchema>;
