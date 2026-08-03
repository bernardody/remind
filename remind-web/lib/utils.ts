import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
// Brasil não observa horário de verão desde 2019 — offset fixo é seguro aqui.
const BRASILIA_OFFSET = "-03:00";

/**
 * O backend manda `LocalDate`/`LocalDateTime` "naive" (sem timezone), sempre
 * em horário de Brasília. `new Date(value)` sozinho depende do timezone do
 * runtime que executa esse código (servidor Next.js em SSR, ou browser do
 * usuário) pra decidir a que instante isso corresponde — funciona por
 * acidente quando esse runtime está em Brasília, e erra (já visto: ~3h de
 * diferença em "há X tempo") em qualquer runtime configurado em outro
 * timezone (ex. UTC, comum em ambientes de deploy). Anexar o offset fixo
 * torna o instante resultante correto independente do runtime.
 */
function parseAsBrasilia(value: string): Date {
  const iso = value.length === 10 ? `${value}T00:00:00` : value;
  return new Date(`${iso}${BRASILIA_OFFSET}`);
}

/** RF-24 — formata `LocalDate` (`"YYYY-MM-DD"`) do backend em pt-BR. */
export function formatDate(value: string): string {
  const date = parseAsBrasilia(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: BRASILIA_TIME_ZONE }).format(date);
}

/** RF-24 — formata `LocalDateTime` do backend em pt-BR (data + hora). */
export function formatDateTime(value: string): string {
  const date = parseAsBrasilia(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BRASILIA_TIME_ZONE,
  }).format(date);
}

/**
 * Data relativa em pt-BR (ex. "há 3 meses") — usar sempre junto da data
 * absoluta (`formatDate`/`formatDateTime`), nunca sozinha (PRD.md §5.6).
 */
export function formatRelativeDate(value: string): string {
  const date = parseAsBrasilia(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(Math.round(diffSeconds), "second");
}
