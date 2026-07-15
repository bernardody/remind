/**
 * Máscaras de digitação (CPF/telefone/CEP) — formata progressivamente
 * enquanto o usuário digita, sempre a partir dos dígitos brutos (o zod
 * (`features/auth/schemas.ts`) só se importa com os dígitos na hora de
 * enviar, então a pontuação aqui é puramente de exibição).
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  const suffix = digits.slice(9, 11);

  let result = parts.join(".");
  if (suffix) result += `-${suffix}`;
  return result;
}

/**
 * Reflui dinamicamente entre celular (11 dígitos, `00000-0000`) e fixo
 * (10 dígitos, `0000-0000`) conforme a quantidade de dígitos já digitados —
 * mesmo comportamento das libs de máscara de telefone BR mais comuns.
 */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const rest = digits.slice(2);
  const splitAt = digits.length > 10 ? 5 : 4;
  const restFormatted =
    rest.length <= splitAt ? rest : `${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;

  return `(${ddd}) ${restFormatted}`;
}

export function maskCEP(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
