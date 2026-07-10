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

/**
 * `GET /questionarios/{id}/pacientes/{pid}/resultado` (`GetPatientQuestionnaireResultResponse`).
 * `average` é só uma média global (PRD §3 dep. #4) — sem breakdown por escala ainda.
 */
export const PatientResultSchema = z.object({
  questionnaireAnswerId: z.number(),
  patientName: z.string(),
  questionnaireTitle: z.string(),
  average: z.number(),
  answeredAt: z.string(),
});
export type PatientResult = z.infer<typeof PatientResultSchema>;
