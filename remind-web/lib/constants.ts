/**
 * Constantes de marca, navegação e conteúdo centralizado.
 * i18n (RF-24): pt-BR default; textos da landing centralizados aqui.
 */
import {
  BarChart3,
  ClipboardList,
  Home,
  LayoutDashboard,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

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
  phone: "+55 51 8156-4975",
  phoneHref: "tel:+555181564975",
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
  psicologo: {
    dashboard: "/psicologo/dashboard",
    pacientes: "/psicologo/pacientes",
    avaliacoes: "/psicologo/avaliacoes",
    relatorios: "/psicologo/relatorios",
    perfil: "/psicologo/perfil",
    completarPerfil: "/psicologo/completar-perfil",
  },
  paciente: {
    inicio: "/paciente/inicio",
    perfil: "/paciente/perfil",
    responder: (questionnaireId: number) => `/paciente/questionarios/${questionnaireId}/responder`,
  },
} as const;

/** Home por perfil pós-login (RF-11) — usado no login e no middleware. */
export const HOME_BY_USER_TYPE = {
  PSYCHOLOGIST: ROUTES.psicologo.dashboard,
  PATIENT: ROUTES.paciente.inicio,
} as const;

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Selo pequeno ao lado do label (ex. "Em breve") — telas ainda placeholder. */
  badge?: string;
}

/** Navegação da sidebar por perfil (RF-13..RF-20) — components/layout/sidebar-nav.tsx. */
export const PSYCHOLOGIST_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.psicologo.dashboard, icon: LayoutDashboard },
  { label: "Pacientes", href: ROUTES.psicologo.pacientes, icon: Users },
  { label: "Avaliações", href: ROUTES.psicologo.avaliacoes, icon: ClipboardList },
  { label: "Relatórios", href: ROUTES.psicologo.relatorios, icon: BarChart3 },
  { label: "Perfil", href: ROUTES.psicologo.perfil, icon: UserCircle },
];

/**
 * Paciente só entra, responde e sai — sem tela de resultados própria (decisão de
 * produto: só o psicólogo vê o escore, ver `.claude/specs/04-spec-aplicacao.md` §5).
 */
export const PATIENT_NAV: NavItem[] = [
  { label: "Início", href: ROUTES.paciente.inicio, icon: Home },
  { label: "Perfil", href: ROUTES.paciente.perfil, icon: UserCircle },
];

/**
 * Faixas de risco (placeholder) — alinhar com backend quando expuser
 * score por escala + faixas (PRD §3 dep. #4). Paleta ordinal de um único
 * matiz (Spec 04 §4) — nunca semáforo verde/amarelo/vermelho.
 *
 * `textColor` é o texto seguro sobre `color` (WCAG AA) — o tom claro do teal
 * ("Baixo") reprova com texto branco (2.42:1); Grafite-Verde nele passa em
 * 6.07:1. Ver PRD.md §2.3/§4.1 (redesign de UI/UX, jul/2026).
 */
export const RISK_BANDS = [
  { label: "Baixo", min: 0, max: 2, color: "#7AB1A8", textColor: "#1C2B2B" },
  { label: "Moderado", min: 2, max: 3.5, color: "#1A7A6E", textColor: "#FFFFFF" },
  { label: "Alto", min: 3.5, max: 5, color: "#0B4A42", textColor: "#FFFFFF" },
] as const;

export type RiskBand = (typeof RISK_BANDS)[number];

/** Nível de risco correspondente a uma média (0–5) — usado no gauge de resultado. */
export function getRiskBand(average: number): RiskBand {
  return (
    RISK_BANDS.find((band) => average >= band.min && average < band.max) ??
    RISK_BANDS[RISK_BANDS.length - 1]
  );
}

/**
 * Nível de risco a partir do label vindo do backend (Fase 5: cada escala tem suas
 * próprias faixas, calculadas e classificadas no backend — `riskLabel` já vem pronto).
 * `null` quando a escala ainda não tem faixas cadastradas (degrade graceful).
 */
export function getRiskBandByLabel(label: string | null): RiskBand | null {
  return RISK_BANDS.find((band) => band.label === label) ?? null;
}
