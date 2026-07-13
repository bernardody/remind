import { z } from "zod";

/** Espelha `enums/InviteStatus.java` (docs/specs/002-convite-questionario). */
export const InviteStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "OPENED",
  "ANSWERED",
  "EXPIRED",
  "REVOKED",
]);
export type InviteStatus = z.infer<typeof InviteStatusSchema>;

/**
 * `POST .../convites` e `POST /convites/{id}/reenviar` (`InviteResponse` real).
 * `inviteLink` só existe aqui — nunca é reexposto pela listagem, porque o
 * backend só guarda o hash do token, não o valor em claro (PRD §16).
 */
export const InviteSchema = z.object({
  id: z.number(),
  status: InviteStatusSchema,
  expiresAt: z.string(),
  inviteLink: z.string(),
});
export type Invite = z.infer<typeof InviteSchema>;

/** `GET /pacientes/{id}/convites` (`ListPatientInviteResponse` real) — sem link. */
export const PatientInviteSchema = z.object({
  id: z.number(),
  questionnaireId: z.number(),
  questionnaireTitle: z.string(),
  status: InviteStatusSchema,
  expiresAt: z.string(),
  sentAt: z.string().nullable(),
  openedAt: z.string().nullable(),
});
export type PatientInvite = z.infer<typeof PatientInviteSchema>;

/**
 * `POST /convites/consumir` (público, `ConsumeInviteResponse` real) — o JWT
 * devolvido tem escopo restrito ao questionário (INV-012, PRD §16), por isso
 * a resposta já inclui `questionnaireId`/`questionnaireTitle` prontos pro
 * redirecionamento direto ao wizard.
 */
export const ConsumeInviteResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  questionnaireId: z.number(),
  questionnaireTitle: z.string(),
});
export type ConsumeInviteResponse = z.infer<typeof ConsumeInviteResponseSchema>;
