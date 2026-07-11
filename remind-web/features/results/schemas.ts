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
