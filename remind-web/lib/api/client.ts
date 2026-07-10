import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { ApiError, type Page, type PageParams } from "./types";

const isBrowser = typeof window !== "undefined";

/**
 * No browser, chamadas passam pelo BFF (rota catch-all `app/api/[...proxy]/route.ts`,
 * mesma origem) que anexa o Bearer a partir do cookie httpOnly — o token nunca
 * chega ao cliente (R5). Server-side, chama o backend direto com `token` explícito.
 *
 * A pasta `[...proxy]` é só o NOME do parâmetro capturado — a rota responde em
 * `/api/*`, não em `/api/proxy/*`. Usar `/api/proxy` aqui faria o catch-all
 * encaminhar para `${API_URL}/proxy/...`, que não existe no backend.
 */
const BASE_URL = isBrowser
  ? "/api"
  : (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Corpo serializado como JSON automaticamente. */
  body?: unknown;
  /** Query params (paginação Spring etc.). */
  params?: Record<string, string | number | boolean | undefined>;
  /** Bearer token (BFF anexa server-side — ver Spec 04). */
  token?: string;
}

function buildUrl(
  path: string,
  params?: RequestOptions["params"],
): string {
  // `new URL` exige base explícita pra entradas relativas (ex: BASE_URL="/api"
  // no browser) — sem isso lança "Invalid URL" antes mesmo do fetch rodar.
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
    isBrowser ? window.location.origin : undefined,
  );
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * `fetch` tipado: base URL, headers JSON, parsing de erro padronizado.
 * Lança `ApiError` em respostas não-2xx.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, token, headers, ...rest } = options;

  const res = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // R1: JWT de 10min sem refresh — 401 no meio da sessão vira logout
  // centralizado (client-side; server-side quem decide é requireSession()).
  if (res.status === 401 && isBrowser) {
    toast.error("Sessão expirada. Faça login novamente.");
    void signOut({ callbackUrl: "/login" });
    throw new ApiError("Sessão expirada", 401);
  }

  const raw = await res.text();
  const data = raw ? safeJson(raw) : null;

  if (!res.ok) {
    const message =
      (isRecord(data) && typeof data.message === "string"
        ? data.message
        : undefined) ?? `Erro ${res.status} ao chamar ${path}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/** Helper para endpoints paginados (Spring `Page<T>`). */
export function apiFetchPage<T>(
  path: string,
  params?: PageParams,
  options?: RequestOptions,
): Promise<Page<T>> {
  return apiFetch<Page<T>>(path, {
    ...options,
    params: params as RequestOptions["params"],
  });
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
