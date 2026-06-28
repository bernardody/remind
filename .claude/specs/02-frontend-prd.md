# Spec 02 — PRD do Frontend ReMind

> Documento de requisitos de produto (PRD) para o **frontend web** do ReMind.
> Resultado de análise do backend existente (`/api`), da identidade visual
> (`/documentacao/idVisual`), do **protótipo da landing no Figma**
> (`/documentacao/idVisual/lp.png` — fonte de verdade do layout/IA da landing) e de
> pesquisa externa de stack (jun/2026).
> **Status:** proposta para aprovação. Nenhum código de frontend foi escrito ainda.

---

## 1. Visão geral do produto

O **ReMind** é uma plataforma clínica para **psicólogos avaliarem e monitorarem o
uso problemático de redes sociais** (dependência digital) em adolescentes e jovens.
O psicólogo aplica questionários baseados em escalas psicométricas validadas, e a
plataforma registra, calcula e apresenta os resultados — "dar nome ao que o paciente
ainda não consegue descrever".

**Atores:**
- **Psicólogo** (`PSYCHOLOGIST`) — cadastra e gerencia pacientes, acompanha respostas
  e resultados, visualiza analytics.
- **Paciente** (`PATIENT`) — responde aos questionários atribuídos e (futuramente)
  acompanha sua própria evolução.

**Domínio das escalas hoje no banco** (`insert.sql`): `CARS`, `UCLA`, `SPI`,
agrupando 11 perguntas com respostas tipo Likert 1–5 (Nunca→Sempre / Discordo
totalmente→Concordo totalmente).

**Marca:** símbolo de elos/balões de conversa; conceito do "ciclo da dependência
digital que se rompe pela conversa clínica". Tom: técnico, sério, moderno, acolhedor.

---

## 2. Objetivo do frontend

Construir, **do zero**, a camada web do ReMind:

1. **Landing page** moderna e orientada a conversão (psicólogos como público-alvo),
   com bom SEO (meta: "referência nacional"), performance e narrativa de marca.
2. **Aplicação autenticada** (dashboards) consumindo a API Spring Boot já em produção
   (`https://api.remindapp.com.br`), com dois perfis (psicólogo e paciente).
3. Uma base **escalável e production-grade**, com design system fiel à identidade
   visual, pronta para crescer (multi-escala, relatórios, longitudinal).

Critérios de sucesso: landing com Lighthouse ≥ 90 (Performance/SEO/A11y); app fluido
(navegação otimista, estados de loading/erro consistentes); código tipado de ponta a
ponta; arquitetura que comporta novas escalas e telas sem refatoração estrutural.

---

## 3. Análise do backend existente (contrato atual)

Base URL produção: `https://api.remindapp.com.br` · dev: `http://localhost:8080`.
Auth: **Bearer JWT RS256** (Spring OAuth2 Resource Server). CORS hoje `*`.

### Endpoints disponíveis

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/login` | pública | retorna `{ accessToken, expiresIn, type }` |
| GET | `/pacientes` | Bearer | lista paginada (Spring `Page`) |
| POST | `/pacientes` | Bearer | cadastra paciente (psicólogo logado) |
| PUT | `/pacientes/{id}` | Bearer | edita paciente |
| DELETE | `/pacientes/{id}` | Bearer | remove (204) |
| GET | `/questionarios` | Bearer | lista paginada |
| GET | `/questionarios/{id}` | Bearer | detalhe + perguntas + opções + escala |
| POST | `/questionarios/{id}/responder` | Bearer | paciente logado responde |
| GET | `/questionarios/{id}/pacientes` | Bearer | quem respondeu |
| GET | `/questionarios/{id}/pacientes/{pid}/respostas` | Bearer | respostas detalhadas |
| GET | `/questionarios/{id}/pacientes/{pid}/resultado` | Bearer | resultado (média) |

### Formatos relevantes

- **Login** → `LoginResponse { accessToken, expiresIn (s), type: "PSYCHOLOGIST"|"PATIENT" }`.
- **Paginação**: Spring `Page` (`content[]`, `totalElements`, `totalPages`, `number`,
  `size`, `first`, `last`) e aceita `?page=&size=&sort=`.
- **Resultado**: `{ questionnaireAnswerId, patientName, questionnaireTitle, average, answeredAt }`
  — hoje apenas **uma média geral** por resposta.

### ⚠️ Lacunas e dependências do backend (impactam o frontend)

Identificadas na análise — devem virar tarefas no backend ou condicionar o escopo do
frontend:

1. **JWT expira em 600s (10 min) e NÃO há endpoint de refresh.** Inviável para uma
   sessão de trabalho clínico. → Backend precisa de *refresh token* + expiração maior;
   enquanto isso, o frontend trata 401 forçando re-login.
2. **Modelo de aquisição é demo-led, não self-service.** O protótipo (`lp.png`) converte
   por **"Solicitar Demonstração"** (formulário de lead), não por cadastro de conta. Logo:
   (a) a landing **não** depende de `POST /psicologos`; o psicólogo é provisionado pelo
   time após a demo; (b) o **formulário de demo precisa de um destino** — endpoint de
   captura de lead ou, idealmente, **webhook do n8n / Chatwoot** (já rodando no mesmo VPS,
   ver spec 01). `POST /pacientes` segue exigindo psicólogo autenticado (correto).
3. **Não há endpoint `/me`** (perfil do usuário logado). O JWT só carrega `email`/`name`.
   → Necessário `GET /me` para header, perfil e telas escopadas ao paciente logado.
4. **Resultado é só uma média global**, mas as escalas (CARS/UCLA/SPI) são domínios
   distintos e os mockups mostram *breakdown por domínio* + escore + nível de risco.
   → Backend precisa expor média/score **por escala** e faixas de risco para alimentar a
   visualização rica. No MVP do frontend, exibimos o que existe (média geral) e
   preparamos os componentes para o detalhamento.
5. **Dashboard do paciente** depende de endpoints escopados ao próprio paciente
   (meus questionários pendentes / meus resultados). Hoje as rotas de resultado exigem
   `patientId` explícito (fluxo de psicólogo).
6. **Bug conhecido**: credenciais erradas retornam **500** em vez de 401
   (já documentado na spec 01). O tratamento de erro do login precisa considerar isso.
7. **Sem OpenAPI/Swagger** no backend → sem geração automática de tipos (ver §6).

---

## 4. Requisitos funcionais

### 4.1 Público / landing (não autenticado)
Layout e IA seguem o protótipo Figma `documentacao/idVisual/lp.png`. Estrutura de seções,
de cima para baixo:

- **RF-01** **Header fixo** com logo + navegação (Início · Desafio · Solução · Como
  funciona · Recursos · Sobre) + **Login** + botão primário **Solicitar Demonstração**
  (âncora para o formulário no fim da página); smooth-scroll entre seções.
- **RF-02** **Hero**: headline "A primeira plataforma de avaliação de dependência
  digital", subtítulo, imagem e CTAs (demonstração / ver como funciona).
- **RF-03** **Faixa de impacto** (fundo teal, ícone de aspas): estatística "+210 milhões…"
  — essência da marca.
- **RF-04** **O Desafio** — "Análise manual deixa padrões clínicos invisíveis" com 3 cards
  (Falta de estrutura · Análise demorada · Padrões invisíveis).
- **RF-05** **A Solução** — "Uma plataforma construída para o psicólogo que leva dados a
  sério": lista de benefícios + card ilustrativo com gráfico (Recharts).
- **RF-06** **Como funciona** — 4 etapas numeradas (01 Cadastre o Paciente · 02 Envie o
  Questionário · 03 Analise os Resultados · 04 Acompanhe a Evolução).
- **RF-07** **Recursos** — grade de 6 cards (Escalas Psicométricas Validadas · Relatórios
  Clínicos Automáticos · Monitoramento de Evolução · Envio Digital para o Paciente ·
  Perfil Completo por Paciente · Dados Protegidos).
- **RF-08** **Demonstração visual** — "Veja como o ReMind funciona": screenshots/mockups
  do app.
- **RF-09** **CTA final + formulário "Solicitar Agendamento/Demonstração"**: captura de
  lead (nome, email, telefone, etc.), com validação, estado de sucesso/erro e envio ao
  destino de lead (webhook n8n/Chatwoot ou endpoint — ver dependência backend #2).
- **RF-10** **Footer**: logo, bloco **Contato** (email, telefone) e bloco **Legal**
  (Política de Privacidade, Termos de Uso) + copyright. Páginas institucionais
  correspondentes (Privacidade/LGPD, Termos).

### 4.2 Autenticação
- **RF-11** Login (email + senha) → guarda sessão; redireciona por `type`
  (psicólogo → dashboard clínico; paciente → área do paciente).
- **RF-12** Logout; proteção de rotas por perfil; expiração de sessão tratada (401).

### 4.3 Psicólogo
- **RF-13** Dashboard: visão geral (nº de pacientes ativos, avaliações recentes,
  atalhos rápidos).
- **RF-14** Pacientes: listar (busca/paginação/filtros), cadastrar, editar, remover.
- **RF-15** Avaliações: listar questionários; ver quem respondeu cada um.
- **RF-16** Resultado de um paciente: visualizar respostas detalhadas e resultado
  (escore/média; domínios e risco quando o backend expuser).
- **RF-17** Analytics/relatórios: evolução do paciente ao longo do tempo (longitudinal),
  comparativos por escala *(condicionado a dados do backend)*.

### 4.4 Paciente
- **RF-18** Responder questionário (fluxo wizard, 1 pergunta/passo, barra de progresso —
  conforme mockup), com validação e revisão antes de enviar.
- **RF-19** Acompanhar seus resultados/histórico *(condicionado a endpoints escopados)*.
- **RF-20** Perfil (dados pessoais, segurança).

### 4.5 Transversais
- **RF-21** Estados de loading (skeletons), vazio e erro padronizados em todas as telas.
- **RF-22** Responsividade total (mobile-first — os mockups são mobile, mas o app é web).
- **RF-23** Acessibilidade (WCAG AA): foco visível, navegação por teclado, contraste,
  formulários rotulados.
- **RF-24** i18n preparado (pt-BR default), formatação de datas/números locais.

---

## 5. Requisitos de UI/UX

**Design tokens (identidade visual oficial):**

| Token | Hex | Uso |
|---|---|---|
| Branco-Neve | `#F5F6F4` | Fundo padrão, áreas de leitura |
| Verde Névoa | `#A8C5C0` | Suporte: ícones, backgrounds secundários, "respiro" |
| Ciano Escuro (primária) | `#1A7A6E` | Símbolo, títulos, botões principais, destaque |
| Grafite Verde | `#1C2B2B` | Texto corrido, headers/rodapés escuros, contraste |

- **Tipografia:** **Plus Jakarta Sans** (logo/títulos em Black; corpo em regular/medium).
  Boa legibilidade para densidade alta de dados clínicos.
- **Tom visual:** clínico e moderno; cantos arredondados; bastante respiro; gráficos
  limpos; micro-interações sutis (não "enfeite"). Suporte a **dark mode** (a marca já
  define versões escuras — Grafite Verde como base).
- **Princípios:** clareza > densidade; um dado importante por vez; feedback imediato em
  ações; o questionário deve ser calmo e sem atrito (afeta a qualidade da resposta).
- **Componentes-chave de visualização:** gauge/escore geral, barras por domínio com
  rótulo de nível (Baixo/Moderado/Alto), linha de evolução temporal, tabela de pacientes.
- **Protótipo de referência:** `documentacao/idVisual/lp.png` define o layout e a
  hierarquia visual da landing (seções, cards, faixas teal, gráfico na seção "Solução",
  formulário de demonstração). É a fonte de verdade visual da Fase 1 — implementar fiel
  a ele, com a paleta e a tipografia acima.

---

## 6. Stack recomendada (com justificativa)

| Camada | Escolha | Justificativa resumida |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Landing precisa de SSR/SSG p/ SEO e performance; app autenticado client-side contra a API externa. Um único projeto cobre marketing **e** dashboards. RSC reduz bundle; streaming melhora percepção. |
| Estilização | **Tailwind CSS v4** | Tokens de marca como CSS variables; produtividade; combina com shadcn; zero CSS morto. |
| Component library | **shadcn/ui** (Radix + Tailwind) | Código **no nosso repo** → controle total para refletir a identidade visual forte do ReMind (não um tema "de prateleira"). Acessível (Radix), sem lock-in de runtime. |
| Tabelas de dados | **TanStack Table** (headless) | Lista de pacientes/avaliações com sort/filtro/paginação e virtualização; integra com shadcn. |
| Animações | **Motion** (`motion/react`, ex-Framer Motion) | 120fps via WAAPI, tree-shakable; uso **seletivo** na landing (hero, scroll reveals, conceito do "ciclo") e micro-interações — não em telas densas de dados. |
| Charts | **Recharts** (default) | Datasets pequenos (escore, domínios, evolução) → SVG e API declarativa casam com React/shadcn. **ECharts** reservado p/ futuro longitudinal denso (canvas, 100k+ pontos). |
| Estado servidor | **TanStack Query** | Cache, dedupe, refetch, estados de loading/erro para toda a API; padrão de mercado, sem Redux. |
| Estado cliente | **Zustand** | UI/sessão leve (perfil em memória, filtros, estado do wizard). Sem boilerplate de Redux. |
| Consumo de API | **Fetch tipado + Zod** (camada `lib/api`) | Validação em runtime das respostas; tratamento central de erro/paginação Spring `Page`/401. **Recomendado:** adicionar `springdoc-openapi` ao backend e gerar tipos com `openapi-typescript` (elimina drift de tipos). |
| Autenticação | **Auth.js (NextAuth) — Credentials provider + BFF** | Login chama `POST /login`; token guardado em **cookie httpOnly** (não em `localStorage` → mitiga XSS). Route Handlers do Next atuam como **proxy/BFF** anexando o Bearer às chamadas ao backend. |
| Forms/validação | **React Hook Form + Zod** | Performático, validação compartilhada com a camada de API. |
| Testes | **Vitest + Testing Library + Playwright** | Unit/componente + e2e dos fluxos críticos (login, responder questionário). |
| Qualidade | ESLint + Prettier + TypeScript strict + Husky | Padrão production-grade. |

**Alternativas avaliadas e descartadas (resumo):**
- *Vite + React SPA*: mais simples, mas perde SSR/SEO da landing — descartado por causa do
  objetivo de aquisição/"referência nacional".
- *Mantine* (em vez de shadcn): entrega tabelas/forms mais rápido out-of-the-box, porém
  estiliza menos fielmente uma marca tão própria; fica como plano B se a velocidade de MVP
  superar a fidelidade de marca.
- *Redux Toolkit / RTK Query*: peso desnecessário sem Redux já no projeto; TanStack Query
  cobre o estado de servidor com menor footprint.
- *Visx*: poder de customização alto, mas custo de tempo não se justifica para os gráficos
  do MVP.

---

## 7. Estrutura de pastas recomendada

Organização **por feature** sobre o App Router (escala melhor que organização por tipo):

```
remind-web/
├── app/
│   ├── (marketing)/                # landing + institucionais (SSG/SSR, público)
│   │   ├── page.tsx                # landing
│   │   ├── sobre/  privacidade/  termos/  contato/
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/  registro/
│   │   └── layout.tsx
│   ├── (app)/                      # área autenticada
│   │   ├── psicologo/
│   │   │   ├── dashboard/  pacientes/  avaliacoes/  relatorios/  perfil/
│   │   ├── paciente/
│   │   │   ├── inicio/  questionarios/[id]/responder/  resultados/  perfil/
│   │   └── layout.tsx              # guarda de sessão + shell (sidebar/topbar)
│   ├── api/                        # Route Handlers (BFF/proxy + Auth.js)
│   │   └── auth/[...nextauth]/
│   ├── layout.tsx                  # root: fontes, providers
│   └── globals.css                 # tokens de marca (CSS vars) + Tailwind
├── components/
│   ├── ui/                         # shadcn (button, dialog, table, ...)
│   ├── charts/                     # gauge, domain-bars, trend-line (wrappers Recharts)
│   ├── marketing/                  # hero, feature-grid, cycle-animation
│   └── layout/                     # sidebar, topbar, page-header
├── features/                       # lógica por domínio
│   ├── auth/   patients/   questionnaires/   results/
│   │   ├── api.ts                  # hooks TanStack Query (usePatients, ...)
│   │   ├── schemas.ts              # Zod (DTOs do backend)
│   │   └── components/
├── lib/
│   ├── api/                        # client fetch tipado, interceptors, Page<T>
│   ├── auth/   utils/   constants.ts
├── hooks/   stores/ (zustand)   types/
├── public/                         # logos da marca (de /documentacao/idVisual)
├── tests/  (e2e Playwright)
├── tailwind.config.ts  ·  next.config.ts  ·  tsconfig.json  ·  .env.example
```

> O frontend vive em repositório/serviço próprio (ex.: `app.remindapp.com.br` ou
> `remindapp.com.br`), deployado no mesmo EasyPanel/Traefik (ver spec 01). Consome a API
> via `NEXT_PUBLIC_API_URL` / variável server-side para o BFF.

---

## 8. Riscos técnicos

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | JWT 10 min sem refresh | Sessão clínica quebra constantemente | Priorizar refresh token no backend; até lá, 401 → re-login transparente + aviso |
| R2 | Sem cadastro de psicólogo | Landing não converte | Alinhar `POST /psicologos`; CTA provisório "Solicitar acesso" |
| R3 | Resultado só com média global | Visualização rica (domínios/risco) sem dados | Componentes preparados; backend expõe score por escala; degrade graceful |
| R4 | Sem OpenAPI → drift de tipos | Bugs de integração | Zod valida respostas; pleitear springdoc + codegen |
| R5 | CORS `*` + token no cliente | Risco XSS se token em localStorage | BFF + cookie httpOnly; restringir CORS à origem do front |
| R6 | Bug login 500 vs 401 | UX de erro confusa | Tratar 500 no fluxo de login como credencial inválida até correção |
| R7 | Dados clínicos sensíveis (LGPD) | Conformidade/privacidade | Não logar PII; HTTPS; consentimento; mascarar dados em telas/prints |
| R8 | Escopo backend ainda evoluindo | Retrabalho de frontend | Camada `features/api` isola contratos; mocks p/ telas dependentes |

---

## 9. Roadmap de implementação

**Fase 0 — Fundação (setup)**
Next.js 15 + TS strict + Tailwind v4 + tokens de marca + Plus Jakarta Sans; shadcn init;
Providers (TanStack Query, tema); camada `lib/api` (fetch tipado, `Page<T>`, erros);
ESLint/Prettier/Husky; CI básico. *Entrega:* esqueleto navegável + design system base.

**Fase 1 — Landing page**
Hero + conceito do "ciclo" (Motion), features, FAQ, CTA, rodapé, páginas institucionais;
SEO/metadata, OG, sitemap; Lighthouse ≥ 90. *Entrega:* landing pública pronta.

**Fase 2 — Autenticação**
Auth.js Credentials + BFF/cookie httpOnly; guarda de rotas por perfil; tratamento de
expiração; redirect por `type`. *Entrega:* login/logout funcionais contra a API real.

**Fase 3 — Dashboard do psicólogo**
Shell (sidebar/topbar); pacientes (CRUD + tabela TanStack); avaliações (lista + quem
respondeu); resultado por paciente (respostas + escore com Recharts). *Entrega:* núcleo
clínico operante.

**Fase 4 — Fluxo do paciente**
Wizard de questionário (1 pergunta/passo, progresso, revisão, envio); confirmação.
*Entrega:* paciente consegue responder fim-a-fim.

**Fase 5 — Resultados & analytics**
Visualização rica (gauge, barras por domínio, nível de risco, evolução temporal) —
acompanhando a evolução do backend; relatórios. *Entrega:* leitura clínica completa.

**Fase 6 — Polimento & produção**
A11y AA, dark mode, performance, testes e2e dos fluxos críticos, deploy no EasyPanel,
domínio + HTTPS. *Entrega:* produção.

> Fases 4–5 dependem das lacunas do backend (§3). Recomenda-se abrir, em paralelo, as
> tarefas de backend: refresh token, `POST /psicologos`, `GET /me`, score por escala,
> endpoints escopados ao paciente e OpenAPI.

---

## 10. Pré-requisitos de backend a alinhar (saída da análise)

1. Refresh token + expiração de access token maior.
2. `POST /psicologos` (registro self-service).
3. `GET /me` (perfil do usuário autenticado).
4. Score/média **por escala** + faixas de risco no resultado.
5. Endpoints escopados ao paciente logado (meus questionários / meus resultados).
6. Correção do login 500→401.
7. `springdoc-openapi` para contrato versionado e geração de tipos.
8. CORS restrito à origem do frontend (em vez de `*`).
