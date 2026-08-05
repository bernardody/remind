import { NextResponse, type NextRequest } from "next/server";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

/**
 * Proxy público (sem sessão) pra `POST /auth/reset-password` — mesmo motivo de
 * `app/api/auth/forgot-password/route.ts`: quem está redefinindo a senha ainda
 * não tem sessão válida, então o BFF genérico autenticado sempre rejeitava com
 * 401 antes de o pedido chegar no backend.
 */
export async function POST(req: NextRequest) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
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
