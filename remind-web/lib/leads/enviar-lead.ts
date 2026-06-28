import "server-only";

import type { LeadInput } from "./schema";

export type EnviarLeadResultado =
  | { status: "enviado"; destino: "notion" | "sheets" }
  | { status: "nao-configurado" };

/**
 * Único ponto que conhece o destino do lead. Trocar Notion → Sheets → n8n no
 * futuro é só reimplementar esta função; o formulário e o Route Handler não
 * mudam. Decisão de destino final fica para depois (ver Spec 03 §2.3).
 *
 * NUNCA logar PII (PRD R7/LGPD).
 */
export async function enviarLead(
  lead: LeadInput,
): Promise<EnviarLeadResultado> {
  const notionToken = process.env.NOTION_TOKEN;
  const notionDb = process.env.NOTION_LEADS_DB_ID;
  const sheetsWebhook = process.env.SHEETS_WEBHOOK_URL;

  if (notionToken && notionDb) {
    await enviarParaNotion(lead, notionToken, notionDb);
    return { status: "enviado", destino: "notion" };
  }

  if (sheetsWebhook) {
    await enviarParaSheets(lead, sheetsWebhook);
    return { status: "enviado", destino: "sheets" };
  }

  // Graceful degrade: nenhum destino configurado — não quebra a landing.
  return { status: "nao-configurado" };
}

async function enviarParaNotion(
  lead: LeadInput,
  token: string,
  databaseId: string,
): Promise<void> {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Nome: { title: [{ text: { content: lead.nome } }] },
        Email: { email: lead.email },
        Telefone: { phone_number: lead.telefone },
        ...(lead.clinica
          ? {
              "Clínica": {
                rich_text: [{ text: { content: lead.clinica } }],
              },
            }
          : {}),
        ...(lead.mensagem
          ? {
              Mensagem: {
                rich_text: [{ text: { content: lead.mensagem } }],
              },
            }
          : {}),
        Origem: { select: { name: "Landing — Solicitar Demonstração" } },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Notion respondeu ${res.status}`);
  }
}

async function enviarParaSheets(
  lead: LeadInput,
  webhookUrl: string,
): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      clinica: lead.clinica ?? "",
      mensagem: lead.mensagem ?? "",
      origem: "Landing — Solicitar Demonstração",
    }),
  });

  if (!res.ok) {
    throw new Error(`Sheets webhook respondeu ${res.status}`);
  }
}
