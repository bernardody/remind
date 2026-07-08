import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/config";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

/**
 * BFF: proxy autenticado entre o browser e o backend Spring. O token nunca
 * chega ao cliente (cookie httpOnly) — é anexado aqui, server-side.
 */
async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> },
) {
  const session = await auth();
  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json(
      { message: "Sessão expirada, faça login novamente." },
      { status: 401 },
    );
  }

  const { proxy: segments } = await params;
  const url = `${API_URL}/${segments.join("/")}${req.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(req.method);

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: hasBody ? await req.text() : undefined,
  });

  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
