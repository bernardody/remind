import { z } from "zod";

/** `GET /questionarios/{id}/pacientes/{pid}/respostas` (`GetPatientQuestionnaireAnswersResponse`). */
export const PatientAnswerDetailSchema = z.object({
  questionId: z.number(),
  questionText: z.string(),
  chosenOption: z.string(),
  chosenValue: z.number(),
});
export type PatientAnswerDetail = z.infer<typeof PatientAnswerDetailSchema>;

export const PatientAnswersSchema = z.object({
  questionnaireAnswerId: z.number(),
  patientName: z.string(),
  questionnaireTitle: z.string(),
  answeredAt: z.string(),
  responses: z.array(PatientAnswerDetailSchema),
});
export type PatientAnswers = z.infer<typeof PatientAnswersSchema>;

/** Score de uma escala dentro do resultado (Fase 5) — `riskLabel` nulo se a escala ainda não tem faixas cadastradas. */
export const ScaleResultSchema = z.object({
  scaleId: z.number(),
  scaleName: z.string(),
  average: z.number(),
  riskLabel: z.string().nullable(),
});
export type ScaleResult = z.infer<typeof ScaleResultSchema>;

/**
 * `GET /questionarios/{id}/pacientes/{pid}/resultado` (`GetPatientQuestionnaireResultResponse`).
 * `average` é a média global; `scaleResults` é o breakdown por escala (Fase 5).
 */
export const PatientResultSchema = z.object({
  questionnaireAnswerId: z.number(),
  patientName: z.string(),
  questionnaireTitle: z.string(),
  average: z.number(),
  answeredAt: z.string(),
  scaleResults: z.array(ScaleResultSchema).default([]),
});
export type PatientResult = z.infer<typeof PatientResultSchema>;

/**
 * Tendência de uma escala entre duas aplicações consecutivas (Fase 5b, docs/specs/
 * 003-relatorios-evolucao-longitudinal/PRD.md §4.4) — `null` na 1ª aplicação, sem rodada
 * anterior pra comparar. Espelha `enums/EvolutionTrend.java`.
 */
export const EvolutionTrendSchema = z.enum(["MELHORA", "PIORA", "ESTAVEL"]);
export type EvolutionTrend = z.infer<typeof EvolutionTrendSchema>;

export const ScaleEvolutionResultSchema = z.object({
  scaleId: z.number(),
  scaleName: z.string(),
  average: z.number(),
  riskLabel: z.string().nullable(),
  trend: EvolutionTrendSchema.nullable(),
});
export type ScaleEvolutionResult = z.infer<typeof ScaleEvolutionResultSchema>;

export const ApplicationResultSchema = z.object({
  questionnaireAnswerId: z.number(),
  answeredAt: z.string(),
  average: z.number(),
  scaleResults: z.array(ScaleEvolutionResultSchema),
});
export type ApplicationResult = z.infer<typeof ApplicationResultSchema>;

/**
 * `GET /questionarios/{id}/pacientes/{pid}/evolucao` (`GetPatientQuestionnaireEvolutionResponse`
 * real) — histórico completo de aplicações, ordenado cronologicamente. Fonte de dados da tela
 * de relatórios (linha do tempo, gráficos de evolução por escala).
 */
export const PatientEvolutionSchema = z.object({
  patientId: z.number(),
  patientName: z.string(),
  questionnaireId: z.number(),
  questionnaireTitle: z.string(),
  applications: z.array(ApplicationResultSchema),
});
export type PatientEvolution = z.infer<typeof PatientEvolutionSchema>;
