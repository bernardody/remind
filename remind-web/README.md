# ReMind — Web

Frontend do **ReMind**: landing page pública + (futura) aplicação clínica.
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui.

> Esta entrega cobre a **Fase 0 (Fundação)** e a **Fase 1 (Landing + institucionais)**
> da [Spec 03](../.claude/specs/03-spec-landing.md). Auth e dashboards: Spec 04.

## Setup

```bash
npm install
cp .env.example .env   # ajuste as variáveis
npm run dev            # http://localhost:3000
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `start` | Build de produção / servir |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run test` | Vitest (unit) |
| `npm run test:e2e` | Playwright (e2e) |

## Variáveis de ambiente

Ver `.env.example`. Destaques:

- `NEXT_PUBLIC_API_URL` / `API_URL` — backend Spring Boot.
- `NEXT_PUBLIC_SITE_URL` — URL pública (SEO/OG/sitemap).
- **Destino do lead** (formulário de demonstração): `NOTION_TOKEN` +
  `NOTION_LEADS_DB_ID` **ou** `SHEETS_WEBHOOK_URL`. Se nenhum estiver
  configurado, `/api/leads` degrada graciosamente (HTTP 202). O destino é
  abstraído por `lib/leads/enviar-lead.ts` — trocar para n8n/Chatwoot no
  futuro não toca o formulário.

## Estrutura

```
app/
  (marketing)/        landing + institucionais (sobre, contato, privacidade, termos)
  api/leads/          Route Handler de captura de lead
  login/              stub (auth real na Spec 04)
components/
  ui/                 shadcn/ui (button, input, form, card, accordion, sonner...)
  marketing/          seções da landing
  charts/             wrapper Recharts
  brand/              logo
lib/
  api/                client fetch tipado + tipos (Page<T>, ApiError)
  leads/              schema Zod + enviarLead()
  constants.ts        marca, navegação, conteúdo (i18n pt-BR)
  utils.ts            cn()
```

## Design tokens

Branco-Neve `#F5F6F4` · Verde Névoa `#A8C5C0` · Ciano Escuro `#1A7A6E` ·
Grafite Verde `#1C2B2B`. Definidos em `app/globals.css` (`@theme`), com dark mode.
Tipografia: Plus Jakarta Sans.
