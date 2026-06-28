import { ApiError, type Page, type PageParams } from "./types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

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
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
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
