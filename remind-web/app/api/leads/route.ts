import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/leads/schema";
import { enviarLead } from "@/lib/leads/enviar-lead";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo inválido." },
      { status: 400 },
    );
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Honeypot: bot preencheu campo oculto → finge sucesso, descarta.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    const resultado = await enviarLead(parsed.data);

    // Destino não configurado: degrada graciosamente (202), não quebra a landing.
    if (resultado.status === "nao-configurado") {
      return NextResponse.json({ ok: true, pending: true }, { status: 202 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // NUNCA logar PII (LGPD). Mensagem genérica.
    return NextResponse.json(
      { ok: false, error: "Não foi possível registrar a solicitação." },
      { status: 502 },
    );
  }
}
