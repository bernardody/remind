import { NextResponse, type NextRequest } from "next/server";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

/**
 * Proxy público (sem sessão) pra `POST /auth/forgot-password` — diferente do BFF
 * genérico (`app/api/[...proxy]/route.ts`), que exige sessão válida antes de
 * encaminhar qualquer coisa. "Esqueci minha senha" é chamado justamente por quem
 * NÃO está logado, então passar pelo proxy autenticado sempre retornava 401 antes
 * de o pedido sequer chegar no backend. Next.js resolve esta rota estática antes
 * do catch-all (mesmo padrão de `app/api/leads/route.ts` coexistindo com ele).
 */
export async function POST(req: NextRequest) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });

  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}
