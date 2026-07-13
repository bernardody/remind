import { formatDateTime } from "@/lib/utils";

const BRAZIL_COUNTRY_CODE = "55";

interface WhatsAppInviteMessageParams {
  patientName: string;
  patientPhone: string;
  questionnaireTitle: string;
  inviteLink: string;
  expiresAt: string;
}

/**
 * Link `wa.me` (click-to-chat) com mensagem pré-preenchida — sem API do
 * WhatsApp Business, sem aprovação de template, sem custo por mensagem. O
 * psicólogo ainda precisa abrir o link e confirmar o envio dentro do
 * WhatsApp; não é um envio automático como o e-mail (ver decisão registrada
 * em docs/specs/002-convite-questionario/PRD.md §20).
 */
export function buildWhatsAppInviteLink({
  patientName,
  patientPhone,
  questionnaireTitle,
  inviteLink,
  expiresAt,
}: WhatsAppInviteMessageParams): string {
  const digits = patientPhone.replace(/\D/g, "");
  const phoneWithCountryCode = digits.startsWith(BRAZIL_COUNTRY_CODE)
    ? digits
    : `${BRAZIL_COUNTRY_CODE}${digits}`;

  const firstName = patientName.trim().split(/\s+/)[0] || patientName;

  const message = [
    `Olá, ${firstName}!`,
    `Seu psicólogo(a) preparou o questionário "${questionnaireTitle}" para você responder — leva só alguns minutos:`,
    inviteLink,
    `Esse link é pessoal e expira em ${formatDateTime(expiresAt)}.`,
  ].join("\n\n");

  return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
}
