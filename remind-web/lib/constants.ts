/**
 * Constantes de marca, navegação e conteúdo centralizado.
 * i18n (RF-24): pt-BR default; textos da landing centralizados aqui.
 */

export const SITE = {
  name: "ReMind",
  shortName: "ReMind",
  tagline: "A primeira plataforma de avaliação de dependência digital",
  description:
    "Plataforma clínica para psicólogos avaliarem e monitorarem o uso problemático de redes sociais em adolescentes e jovens, com escalas psicométricas validadas.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://remindapp.com.br",
  locale: "pt-BR",
  email: "remindappbr@gmail.com",
  phone: "+55 (00) 00000-0000",
  phoneHref: "tel:+550000000000",
} as const;

export const BRAND_COLORS = {
  snow: "#F5F6F4",
  mist: "#A8C5C0",
  primary: "#1A7A6E",
  graphite: "#1C2B2B",
} as const;

/** Itens do menu — âncoras absolutas para as seções da landing (RF-01). */
export const NAV_ITEMS = [
  { label: "Início", href: "/#inicio" },
  { label: "Desafio", href: "/#desafio" },
  { label: "Solução", href: "/#solucao" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Recursos", href: "/#recursos" },
  { label: "Sobre", href: "/sobre" },
] as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  sobre: "/sobre",
  contato: "/contato",
  privacidade: "/privacidade",
  termos: "/termos",
  demoAnchor: "/#agendamento",
} as const;

/**
 * Faixas de risco (placeholder) — alinhar com backend quando expuser
 * score por escala + faixas (PRD §3 dep. #4).
 */
export const RISK_BANDS = [
  { label: "Baixo", min: 0, max: 2, color: "#1A7A6E" },
  { label: "Moderado", min: 2, max: 3.5, color: "#E0A21F" },
  { label: "Alto", min: 3.5, max: 5, color: "#C0432F" },
] as const;

export type RiskBand = (typeof RISK_BANDS)[number];
