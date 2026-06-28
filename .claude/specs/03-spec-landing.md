# Spec 03 — Implementação da Landing Page

> Spec de implementação derivada do PRD ([`02-frontend-prd.md`](02-frontend-prd.md)).
> Cobre a **Fundação (Fase 0)** — compartilhada com a [Spec 04 (Aplicação)](04-spec-aplicacao.md) —
> e a **Landing pública + páginas institucionais (Fase 1)**.
> Fonte de verdade do layout: `documentacao/idVisual/lp.png`.
> **Status:** pronta para implementação. Projeto novo em `remind-web/`.

---

## 0. Escopo desta spec

| Inclui | Não inclui (ver Spec 04) |
|---|---|
| Setup do projeto Next.js 15 + design system | Auth.js / login / BFF |
| Tokens de marca, fontes, providers, `lib/api` base | Dashboards psicólogo/paciente |
| Todas as seções da landing (`lp.png`) | Wizard de questionário |
| Páginas institucionais (sobre, privacidade, termos, contato) | Tabelas de dados / TanStack Table |
| Formulário "Solicitar Demonstração" (captura de lead) | Charts de resultado clínico |
| SEO, metadata, OG, sitemap, robots | — |

> **Destino do lead** (PRD §3, dep. #2): o formulário de demo precisa de um destino.
> **Decisão atual:** sem n8n por enquanto — o lead vai para **Notion ou Google Sheets**
> (o que for mais rápido de plugar). O Route Handler `/api/leads` abstrai o destino atrás de
> uma única função `enviarLead()`, então trocar de destino (Notion → Sheets → n8n no futuro)
> não toca o formulário nem as outras telas. **Ponto em aberto a revisitar depois.**
> Não depende de `POST /psicologos`.

---

## 1. Fundação (Fase 0) — compartilhada com a Spec 04

### 1.1 Arquivos a criar — bootstrap do projeto

| Arquivo | O que conter |
|---|---|
| `remind-web/package.json` | Next 15, React 19, TS 5, Tailwind v4, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`, `motion`, `next-themes`, `lucide-react`, `clsx`, `tailwind-merge`. Dev: `eslint`, `prettier`, `husky`, `lint-staged`, `vitest`, `@testing-library/react`, `@playwright/test`. |
| `remind-web/tsconfig.json` | `strict: true`, `paths` com alias `@/*`. |
| `remind-web/next.config.ts` | `reactStrictMode`, `images.remotePatterns` (se houver imagens externas), headers de segurança base. |
| `remind-web/.env.example` | `NEXT_PUBLIC_API_URL`, `API_URL` (server-side BFF), `NEXT_PUBLIC_SITE_URL`, **destino do lead** (Notion: `NOTION_TOKEN`, `NOTION_LEADS_DB_ID` — ou Sheets: `SHEETS_WEBHOOK_URL`). |
| `remind-web/.eslintrc` / `prettier.config.js` | Padrão Next + Tailwind plugin de ordenação de classes. |
| `remind-web/.husky/pre-commit` | `lint-staged` (eslint + prettier + tsc --noEmit). |
| `remind-web/.gitignore` | `.next`, `node_modules`, `.env*`, `playwright-report`. |

### 1.2 Design system — tokens de marca

| Arquivo | O que conter |
|---|---|
| `remind-web/app/globals.css` | Import Tailwind v4 (`@import "tailwindcss"`); bloco `@theme` com CSS vars dos tokens: `--color-snow:#F5F6F4`, `--color-mist:#A8C5C0`, `--color-primary:#1A7A6E`, `--color-graphite:#1C2B2B`. Variantes dark (base Grafite Verde). Raios arredondados, sombras suaves. |
| `remind-web/app/layout.tsx` | Root layout: carrega **Plus Jakarta Sans** via `next/font/google` (pesos 400/500/700/800), aplica vars de fonte, `<html lang="pt-BR">`, monta `<Providers>`, metadata base. |
| `remind-web/app/providers.tsx` | `'use client'`: `QueryClientProvider` (TanStack Query) + `ThemeProvider` (next-themes, dark mode). |
| `remind-web/lib/utils.ts` | `cn()` (clsx + tailwind-merge). |
| `remind-web/lib/constants.ts` | Constantes de marca, nav items, URLs, faixas de risco (placeholder). |

### 1.3 shadcn/ui base (componentes usados na landing)

`components/ui/`: `button`, `input`, `textarea`, `label`, `card`, `accordion` (FAQ),
`sonner`/`toast` (feedback do formulário), `form` (RHF wrappers).
Init via `npx shadcn@latest init` mapeando cores aos tokens de marca.

### 1.4 Camada `lib/api` base (estrutura, sem hooks de domínio)

| Arquivo | O que conter |
|---|---|
| `remind-web/lib/api/client.ts` | `fetch` tipado: base URL, headers JSON, parsing de erro padronizado (`ApiError`), tratamento de `Page<T>` Spring. (Hooks de domínio ficam na Spec 04.) |
| `remind-web/lib/api/types.ts` | `Page<T>`, `ApiError`. |

### 1.5 Assets de marca

Copiar de `documentacao/idVisual/` para `remind-web/public/brand/`:
logo completo (cor/dark/light), símbolo, ícones. Criar `public/favicon`, `public/og-image.png`.

**Entrega Fase 0:** esqueleto navegável, design system aplicado, tema claro/escuro funcionando.

---

## 2. Landing Page (Fase 1)

### 2.1 Estrutura de rotas a criar

```
remind-web/app/
├── (marketing)/
│   ├── layout.tsx          # header fixo + footer, smooth-scroll
│   ├── page.tsx            # landing (compõe todas as seções)
│   ├── sobre/page.tsx
│   ├── contato/page.tsx
│   ├── privacidade/page.tsx
│   └── termos/page.tsx
└── api/
    └── leads/route.ts      # Route Handler: recebe form de demo → LEAD_WEBHOOK_URL
```

### 2.2 Componentes da landing a criar (`components/marketing/`)

Cada seção é um componente; `page.tsx` apenas compõe na ordem do `lp.png`.

| Componente | RF | Conteúdo (fiel ao `lp.png`) |
|---|---|---|
| `site-header.tsx` | RF-01 | Header fixo: logo + nav (Início · Desafio · Solução · Como funciona · Recursos · Sobre) + link **Login** (`/login`) + botão **Solicitar Demonstração** (âncora `#agendamento`). Smooth-scroll; menu mobile (sheet). |
| `hero.tsx` | RF-02 | Badge, headline "A primeira plataforma de avaliação de dependência digital", subtítulo, imagem (foto do mockup) e 2 CTAs (Comece agora grátis / Ver como funciona). Reveal sutil via Motion. |
| `impact-band.tsx` | RF-03 | Faixa teal (`--color-primary`), ícone de aspas, estatística "+210 milhões…". |
| `challenge.tsx` | RF-04 | Título "Análise manual deixa padrões clínicos invisíveis" + 3 cards (Falta de estrutura · Análise demorada · Padrões invisíveis). |
| `solution.tsx` | RF-05 | Título "Uma plataforma construída para o psicólogo que leva dados a sério" + lista de benefícios + card ilustrativo com **gráfico de barras (Recharts)** com dados mock (ex.: "Rodrigo M. Prado"). |
| `how-it-works.tsx` | RF-06 | "Em quatro etapas… o diagnóstico clínico evolui" + 4 etapas numeradas (01 Cadastre o Paciente · 02 Envie o Questionário · 03 Analise os Resultados · 04 Acompanhe a Evolução). |
| `features.tsx` | RF-07 | "Tudo o que você precisa com rigor científico" + grade de 6 cards (Escalas Psicométricas Validadas · Relatórios Clínicos Automáticos · Monitoramento de Evolução · Envio Digital para o Paciente · Perfil Completo por Paciente · Dados Protegidos). |
| `app-showcase.tsx` | RF-08 | "Veja como o ReMind funciona" — screenshots/mockups do app. |
| `demo-form.tsx` | RF-09 | Âncora `#agendamento`. Faixa teal "Veja o ReMind funcionando no seu fluxo de trabalho" + form **Solicitar Agendamento** (nome, email, telefone + campos do mockup). RHF + Zod; estados loading/sucesso/erro; POST para `/api/leads`. |
| `site-footer.tsx` | RF-10 | Logo + bloco Contato (email `remindappbr@gmail.com`, telefone) + bloco Legal (links Privacidade/Termos) + copyright. |

> Charts: criar wrapper `components/charts/bar-chart.tsx` (Recharts) usado pela seção Solução.

### 2.3 Lead capture — Route Handler

`app/api/leads/route.ts`:
- `POST`: valida payload com Zod (schema compartilhado com `demo-form.tsx`).
- Chama `lib/leads/enviar-lead.ts` → função `enviarLead(lead)` que encapsula o destino.
  **Destino atual: Notion ou Google Sheets** (escolher um na implementação):
  - **Notion:** `POST` na Notion API criando uma página numa database "Leads"
    (`NOTION_TOKEN`, `NOTION_LEADS_DB_ID`).
  - **Google Sheets:** append numa planilha via service account / Apps Script webhook
    (`SHEETS_WEBHOOK_URL` ou credenciais).
- Se o destino não estiver configurado: retorna 202 (graceful degrade, não quebra a landing).
- **Nunca logar PII** (PRD R7/LGPD). Retorna `{ ok: true }` / erro padronizado.

> A função `enviarLead()` é o único ponto que conhece o destino — trocar para n8n/Chatwoot
> no futuro é só reimplementá-la. **Decisão de destino final fica para depois.**

### 2.4 Páginas institucionais (RF-10)

- `sobre/`, `contato/`, `privacidade/` (LGPD), `termos/`: conteúdo estático, mesmo layout marketing, metadata própria. Privacidade e Termos com placeholders de texto legal a revisar.

### 2.5 SEO & performance (meta: Lighthouse ≥ 90)

| Arquivo | O que conter |
|---|---|
| `app/(marketing)/page.tsx` (export `metadata`) | Title, description, keywords, OpenGraph, Twitter card. |
| `app/sitemap.ts` | Rotas públicas. |
| `app/robots.ts` | Permitir indexação; apontar sitemap. |
| `app/manifest.ts` | PWA básico (nome, ícones, cores de marca). |
| JSON-LD | `Organization` / `SoftwareApplication` no layout marketing. |

Performance: imagens via `next/image`; fontes com `display: swap`; seções server-rendered
(RSC), Motion só nos pontos de reveal; sem libs pesadas no caminho crítico.

### 2.6 Transversais (PRD §4.5)

- **A11y (RF-23):** header navegável por teclado, foco visível, contraste AA, form com labels.
- **Responsividade (RF-22):** mobile-first conforme mockups.
- **i18n (RF-24):** pt-BR default; textos centralizados em `lib/constants.ts` ou `dictionaries/`.

---

## 3. Resumo — arquivos desta spec

**Criar (Fase 0):** `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`,
configs de lint/husky, `app/globals.css`, `app/layout.tsx`, `app/providers.tsx`,
`lib/utils.ts`, `lib/constants.ts`, `lib/api/{client,types}.ts`, `components/ui/*` (shadcn),
assets em `public/brand/`.

**Criar (Fase 1):** `app/(marketing)/{layout,page}.tsx`, 4 páginas institucionais,
`app/api/leads/route.ts`, `lib/leads/enviar-lead.ts`, `components/marketing/*` (10 componentes),
`components/charts/bar-chart.tsx`, `app/{sitemap,robots,manifest}.ts`.

**Modificar:** nenhum (projeto novo).

**Em aberto (ver depois):** destino final do lead — hoje Notion/Google Sheets via
`enviarLead()`; n8n/Chatwoot fica como evolução futura.

**Entrega:** landing pública + institucionais, SEO/OG/sitemap, Lighthouse ≥ 90.
