# Spec 04 — Implementação da Aplicação Autenticada

> Spec de implementação derivada do PRD ([`02-frontend-prd.md`](02-frontend-prd.md)).
> Cobre **Autenticação (Fase 2)**, **Dashboard do Psicólogo (Fase 3)**,
> **Fluxo do Paciente (Fase 4)** e **Resultados & Analytics (Fase 5)**.
> **Pré-requisito:** Fundação (Fase 0) da [Spec 03](03-spec-landing.md) já implementada.
> **Status:** Fase 2 (Autenticação) e a Fase 3 (Dashboard do Psicólogo) **implementadas e
> em produção**, com uma lacuna (`pacientes/[id]`). Fase 4 e Fase 5 ainda **pendentes**
> (telas hoje são placeholder). Contratos baseados no código real em `/api`.

### Status de implementação (atualizado 2026-07-10 — bug de carregamento pacientes/avaliações corrigido)

| Parte | Status |
|---|---|
| Autenticação (Fase 2) — Auth.js, BFF proxy, middleware, tela de login | ✅ Implementado, testado com backend real, em produção |
| Shell da aplicação (sidebar, topbar, page-header, loading/empty/error state) | ✅ Implementado, em produção |
| Dashboard do Psicólogo (Fase 3) — cards de visão geral | ✅ Implementado, em produção |
| Pacientes (Fase 3) — lista paginada + CRUD (`patients-view.tsx`) | ✅ Implementado, em produção |
| Pacientes (Fase 3) — perfil individual (`pacientes/[id]`, dados + avaliações respondidas) | ⏳ Pendente — nunca foi criado, sem link apontando pra lá ainda |
| Avaliações (Fase 3) — lista + detalhe + quem respondeu + resultado (gauge) | ✅ Implementado, em produção |
| Relatórios (Fase 3 na spec original, mas depende da Fase 5) | ⏳ Placeholder deliberado — sem dado de backend pra evolução longitudinal ainda |
| Perfil (psicólogo/paciente) | ✅ Implementado (lê nome/email/tipo do JWT) |
| Fluxo do Paciente (Fase 4: wizard de resposta) | ⏳ Pendente — `inicio/`/`resultados/` placeholder, wizard não existe |
| Resultados & Analytics (Fase 5: domain-bars, trend-line) | ⏳ Pendente — `gauge.tsx` já existe e está em uso no resultado do psicólogo |
| Deploy produção (Vercel: env vars) + backend VPS (schema + `GOOGLE_CLIENT_ID`) | ✅ Estabilizado |

---

## 0. Contrato real da API (validado no código)

Base: `API_URL` (server/BFF) · `https://api.remindapp.com.br` prod · `localhost:8080` dev.
Auth: Bearer JWT RS256, `expiresIn: 600s`. **Sem refresh, sem `/me`** (PRD §3).

| Método | Rota | DTO resposta (campos reais) |
|---|---|---|
| POST | `/login` | `{ accessToken, expiresIn, type: "PSYCHOLOGIST"\|"PATIENT", profileComplete: boolean }` |
| GET | `/pacientes` | `Page<{ id, name, email, phone, birthDate, gender(char), createdAt, active }>` |
| POST | `/pacientes` | body: `{ name, email, cpf, phone, password, birthDate, gender }` |
| PUT | `/pacientes/{id}` | `UpdatePatientResponse` |
| DELETE | `/pacientes/{id}` | 204 |
| GET | `/questionarios` | `Page<QuestionnaireResponse>` |
| GET | `/questionarios/{id}` | `{ id, title, created_at, updated_at, active, questions[] }` onde `questions[] = { id, scale{id,name,...}, text, order_number, options[]{ id, name, value } }` |
| POST | `/questionarios/{id}/responder` | body: `{ responses: [{ questionId, questionOptionId }] }` |
| GET | `/questionarios/{id}/pacientes` | `Page<{ patientId, patientName, answeredAt }>` |
| GET | `/questionarios/{id}/pacientes/{pid}/respostas` | `{ questionnaireAnswerId, patientName, questionnaireTitle, answeredAt, responses[]{ questionId, questionText, chosenOption, chosenValue } }` |
| GET | `/questionarios/{id}/pacientes/{pid}/resultado` | `{ questionnaireAnswerId, patientName, questionnaireTitle, average, answeredAt }` |

> ⚠️ **Resultado = só `average` global** (PRD §3 #4). Breakdown por escala/risco ainda não
> existe → componentes preparados, degrade graceful.
> ✅ **R6 corrigido no backend**: `LoginController` já lança `401` (`ResponseStatusException`)
> para credencial errada ou conta só-Google, em vez do `500` documentado no PRD. O frontend
> mantém o tratamento de "qualquer não-2xx = credencial inválida" como rede de segurança
> defensiva (não custa nada e cobre erros 5xx genéricos), mas não é mais uma correção de bug
> conhecido.
> ⚠️ **JWT de acesso**: claims reais são `{ iss: "tcc", sub: <nome do usuário>, iat, exp, email }`
> — **não existe claim `name`** separado; `sub` É o nome (não um id único). Usar `email` como
> identificador estável no cliente (`session.user.id`).
> ⚠️ **Login Google do psicólogo** (spec de backend `001-login-google-psicologo`, já
> implementada em `/api`): complementa o login por senha. Contas criadas via Google nascem
> com `profileComplete: false` e o token fica restrito (só perfil/conclusão de perfil; demais
> endpoints retornam `403`) até a conclusão. Fora do escopo desta spec (sem UI de "Continuar
> com o Google" ainda) — tratar como próxima spec quando o frontend for pedido.

---

## 1. Camada de API por feature (`features/`)

Estende o `lib/api/client.ts` da Fase 0. Cada feature: `schemas.ts` (Zod, valida resposta),
`api.ts` (hooks TanStack Query), `components/`.

| Arquivo | Status | O que conter |
|---|---|---|
| `features/auth/schemas.ts` | ✅ Feito | `LoginRequest`, `LoginResponse` (+ `profileComplete`), enum `UserType`. |
| `features/patients/schemas.ts` | ⏳ Pendente | `Patient`, `InsertPatient`, `UpdatePatient`, `PagePatient`. |
| `features/patients/api.ts` | ⏳ Pendente | `usePatients(pageable)`, `useCreatePatient`, `useUpdatePatient`, `useDeletePatient` (com invalidação de cache). |
| `features/questionnaires/schemas.ts` | ⏳ Pendente | `Questionnaire`, `QuestionnaireDetail`, `Question`, `Option`, `AnswerRequest`. |
| `features/questionnaires/api.ts` | ⏳ Pendente | `useQuestionnaires`, `useQuestionnaire(id)`, `useAnswerQuestionnaire`, `useQuestionnairePatients(id)`. |
| `features/results/schemas.ts` | ⏳ Pendente | `PatientAnswers`, `PatientResult`. |
| `features/results/api.ts` | ⏳ Pendente | `usePatientAnswers(qid, pid)`, `usePatientResult(qid, pid)`. |

---

## 2. Autenticação (Fase 2) — BFF + cookie httpOnly ✅ Implementado

Estratégia PRD §6: Auth.js Credentials + Route Handlers como proxy; token em cookie httpOnly
(não localStorage → mitiga XSS, R5). Implementado com **Auth.js v5** (`next-auth@5.0.0-beta`),
testado ponta a ponta com o backend real (`camila.nogueira.cf@gmail.com`) e em produção (Vercel).

### Arquivos criados

| Arquivo | RF | O que contém |
|---|---|---|
| `lib/auth/config.ts` | — | Auth.js v5: Credentials provider chama `POST /login`; persiste `accessToken`/`type`/`expiresIn`/`profileComplete` no JWT da sessão (cookie httpOnly, `maxAge: 600`). `name` vem do claim `sub` do JWT (não existe claim `name`); `id` da sessão usa `email` (único identificador estável). |
| `types/next-auth.d.ts` | — | Augmentação de tipos `User`/`Session`/`JWT` (Auth.js v5). |
| `app/api/auth/[...nextauth]/route.ts` | RF-11 | Handlers Auth.js (`export const { GET, POST } = handlers`). |
| `app/api/[...proxy]/route.ts` (BFF) | RF-12 | Proxy que anexa `Authorization: Bearer` (da sessão) às chamadas ao backend; `401` se sessão ausente/expirada. |
| `app/(auth)/layout.tsx` | — | Split-screen: painel de marca (Grafite Verde, símbolo animado, motion) + slot do form. Logo mobile via `lg:hidden`. |
| `app/(auth)/login/page.tsx` + `features/auth/components/{login-form,brand-panel}.tsx` | RF-11 | Form email+senha (RHF+Zod), toggle mostrar/ocultar senha, erro inline com shake (`prefers-reduced-motion` respeitado). Trata **qualquer não-2xx como credencial inválida** (rede de segurança pós-R6, ver §0). Sucesso → `getSession()` client + redirect por `type` (`HOME_BY_USER_TYPE`). |
| `middleware.ts` | RF-12 | Protege `/psicologo/*` e `/paciente/*`; redireciona não autenticado → `/login` (preserva `callbackUrl`); barra perfil errado por rota (redireciona pro home do próprio perfil). |
| `lib/auth/session.ts` | — | Helpers `getSession()`, `requireSession()` (checa `expiresAt`), `requireRole(type)`. |
| `features/auth/components/profile-card.tsx` | RF-20 | Card de dados do usuário logado — usado nas telas `perfil/` de ambos os perfis. |

> **Refresh ausente (R1):** sem refresh token no backend, sessão expira em 10min (`maxAge: 600`
> alinhado ao `expiresIn`). 401 do BFF em chamadas subsequentes → `signOut()` + toast "sessão
> expirada" automático (ver `lib/api/client.ts`, §3).
> **`/me` ausente:** `name`/`email`/`type` vêm do JWT (decodificado sem verificar assinatura,
> seguro porque acabou de ser emitido pelo próprio backend na mesma chamada server-side).
> Isolado em `lib/auth/config.ts` para migração futura a `GET /me`.
> **Deploy:** variáveis de ambiente (`AUTH_SECRET`, `API_URL`, `NEXT_PUBLIC_API_URL`,
> `NEXT_PUBLIC_SITE_URL`) configuradas no Vercel (produção) — necessárias em qualquer novo
> ambiente/preview, senão o Auth.js quebra com erro de "server configuration".

---

## 3. Shell da aplicação (`app/(app)/`) ✅ Implementado

| Arquivo | O que contém |
|---|---|
| `app/(app)/layout.tsx` | `requireSession()` (guarda) + `AppShell`. Modo claro apenas (sem toggle de tema — `ThemeProvider` roda com `forcedTheme="light"`, igual à Fase 0). |
| `components/layout/app-shell.tsx` | Composição: sidebar fixa desktop + `Sheet` mobile (Radix Dialog) + `Topbar` + `<main>`. Estado do menu mobile fica aqui (client component). |
| `components/layout/sidebar-nav.tsx` | Nav por perfil (`PSYCHOLOGIST_NAV`/`PATIENT_NAV` em `lib/constants.ts`), item ativo via `usePathname()`. Sidebar em Grafite Verde (fundo escuro é uso previsto pelo `id.md` §1). |
| `components/layout/topbar.tsx` | Trigger do menu mobile + dropdown de usuário (avatar com iniciais, nome/email, "Sair"). |
| `components/layout/page-header.tsx` | Cabeçalho reutilizável de página (título + descrição + ações). |
| `components/shared/{loading,empty,error}-state.tsx` | RF-21: skeleton (`components/ui/skeleton.tsx`), vazio e erro padronizados. |
| `components/ui/{dropdown-menu,sheet}.tsx` | Primitivos shadcn novos (Radix `react-dropdown-menu`/`react-dialog`). Sem o plugin `tailwindcss-animate` — animações via keyframes próprios em `globals.css` (`--animate-popover-in`, `--animate-sheet-in-{left,right}`). |
| `components/brand/logo.tsx` | Ganhou `variant="dark"` (símbolo + texto brancos, variação "Escura" do `id.md` §3) para uso em fundo escuro. |

---

## 4. Dashboard do Psicólogo (Fase 3)

> **Status:** implementada e em produção, com uma lacuna. `dashboard/`, `pacientes/` (CRUD),
> `avaliacoes/`, `avaliacoes/[id]/` e `avaliacoes/[id]/pacientes/[pid]/` (resultado com gauge)
> são reais, testadas com backend real (inclusive o bug de `BASE_URL`/`buildUrl` que impedia
> `/pacientes` e `/questionarios` de carregar no browser — corrigido em `lib/api/client.ts`).
> `pacientes/[id]/` nunca foi criada (sem link apontando pra lá ainda). `relatorios/`
> permanece placeholder deliberado — depende da Fase 5.

```
app/(app)/psicologo/
├── dashboard/page.tsx      ✅ real (cards de contagem via /pacientes, /questionarios)
├── pacientes/page.tsx      ✅ real (CRUD completo, TanStack Table)
├── pacientes/[id]/page.tsx ⏳ não criado — gap da Fase 3
├── avaliacoes/page.tsx     ✅ real
├── avaliacoes/[id]/page.tsx ✅ real (detalhe + quem respondeu)
├── avaliacoes/[id]/pacientes/[pid]/page.tsx ✅ real (respostas + resultado/gauge)
├── relatorios/page.tsx     ⏳ placeholder (depende da Fase 5)
└── perfil/page.tsx         ✅ real (ProfileCard, dados do JWT)
```

| Tela | RF | O que conter |
|---|---|---|
| `dashboard/` | RF-13 | ✅ Cards de visão geral: nº de pacientes ativos (de `/pacientes`), avaliações recentes, atalhos. |
| `pacientes/` | RF-14 | ✅ **TanStack Table** + shadcn: lista paginada (Spring `Page`), busca, sort. Botão "Novo paciente" → dialog com form (`InsertPatientRequest`: name, email, cpf, phone, password, birthDate, gender) RHF+Zod. Editar/remover (confirm dialog). Navegação otimista + invalidação de cache. |
| `pacientes/[id]/` | RF-14/16 | ⏳ **Pendente.** Perfil do paciente: dados + avaliações respondidas. |
| `avaliacoes/` | RF-15 | ✅ Lista de questionários (`/questionarios`). |
| `avaliacoes/[id]/` | RF-15 | ✅ Detalhe do questionário + lista de quem respondeu (`/questionarios/{id}/pacientes`). |
| `avaliacoes/[id]/pacientes/[pid]/` | RF-16 | ✅ Respostas detalhadas (`/respostas`) + resultado (`/resultado`): escore via **gauge (Recharts)**. Componentes de breakdown por domínio **preparados mas ocultos/placeholder** até backend expor (R3). |
| `relatorios/` | RF-17 | ⏳ Evolução longitudinal / comparativos por escala — **condicionado a dados do backend**; placeholder com aviso "em breve" mantido até a Fase 5. |
| `perfil/` | RF-20 | ✅ Dados do usuário logado (do JWT) via `ProfileCard`. Segurança (trocar senha etc.) ainda pendente — sem endpoint no backend. |

> ⚠️ **Perfil incompleto (backend):** contas de psicólogo com `profileComplete: false`
> (criadas via Google, ou seeds antigos sem a coluna migrada) têm o token restrito pelo
> backend — endpoints além de perfil retornam `403`. Ao implementar as telas acima, tratar
> esse caso (ex.: banner "complete seu perfil" + bloqueio), hoje fora do escopo desta spec.

### Componentes de visualização a criar (`components/charts/`)

`gauge.tsx` (escore geral), `domain-bars.tsx` (barras por domínio + nível Baixo/Moderado/Alto —
usa faixas de risco quando existirem), `trend-line.tsx` (evolução temporal). Recharts.
`features/patients/components/` e `features/results/components/` para tabelas/cards específicos.

#### Escala de risco (Baixo/Moderado/Alto) — paleta

Baixo/Moderado/Alto é uma variável **ordinal** (posição numa sequência), não categórica —
por isso não leva cores "de semáforo" (verde/amarelo/vermelho), que fugiriam da paleta de 4
cores do `id.md` e destoariam do resto da app. Usa-se uma **rampa de um único matiz** (o do
Ciano Escuro `#1A7A6E`), variando só a luminosidade — validado com `validate_palette.js --ordinal`:

| Nível | Hex | Uso |
|---|---|---|
| Baixo | `#7AB1A8` | tom claro do teal |
| Moderado | `#1A7A6E` | Ciano Escuro (cor primária, sem alteração) |
| Alto | `#0B4A42` | tom escuro do teal |

Regras: **nunca só a cor** — todo indicador de nível vem acompanhado de ícone e/ou label textual
(ex.: "Alto risco"), nunca cor isolada. Declarar como tokens (`--risk-low`, `--risk-mid`,
`--risk-high`) junto aos demais tokens de marca, não hardcode nos componentes.

---

## 5. Fluxo do Paciente (Fase 4)

> **Status:** mesma situação da Fase 3 — `inicio/` e `resultados/` são placeholder;
> `perfil/` é real; o wizard de resposta (`questionarios/[id]/responder/`) ainda não existe.

```
app/(app)/paciente/
├── inicio/page.tsx                        ⏳ placeholder
├── questionarios/[id]/responder/page.tsx  ⏳ não criado
├── resultados/page.tsx                    ⏳ placeholder
└── perfil/page.tsx                        ✅ real (ProfileCard, dados do JWT)
```

| Tela | RF | O que conter |
|---|---|---|
| `inicio/` | RF-18 | Questionários atribuídos/pendentes. ⚠️ Hoje as rotas exigem `patientId` explícito (PRD §3 #5); até existir endpoint escopado, listar via `/questionarios` e tratar escopo no cliente / mock. |
| `questionarios/[id]/responder/` | RF-18 | **Wizard**: 1 pergunta/passo, barra de progresso, navegação prev/next, revisão antes de enviar. Carrega via `useQuestionnaire(id)`; estado do wizard em **Zustand** (`stores/wizard-store.ts`). Envia `POST /responder` com `{ responses: [{ questionId, questionOptionId }] }`. Tela de confirmação. Tom calmo, sem atrito (PRD §5). |
| `resultados/` | RF-19 | Histórico próprio — **condicionado a endpoints escopados** (#5); placeholder até lá. |
| `perfil/` | RF-20 | Dados pessoais + segurança. |

| Arquivo extra | O que conter |
|---|---|
| `stores/wizard-store.ts` | Zustand: respostas em progresso, passo atual, validação por passo. |
| `features/questionnaires/components/wizard/*` | `question-step.tsx`, `progress-bar.tsx`, `review-step.tsx`, `confirmation.tsx`. |

---

## 6. Resultados & Analytics (Fase 5)

Evoluir com o backend (PRD §3 #4): quando `resultado` expuser score **por escala** + faixas de
risco, ativar `domain-bars.tsx` e `gauge.tsx` com dados reais; `trend-line.tsx` para longitudinal
quando houver série temporal. Até lá: exibir `average` global e manter componentes em degrade graceful.

---

## 7. Riscos que afetam esta spec (PRD §8)

| Risco | Mitigação nesta spec |
|---|---|
| R1 JWT 10 min sem refresh | 401 centralizado → re-login transparente + aviso; isolar em `session.ts`. |
| R3 Resultado só média | Componentes de domínio prontos, ocultos até backend; sem quebrar UI. |
| R4 Sem OpenAPI → drift | Zod valida toda resposta em runtime; tipos derivam dos schemas. |
| R5 XSS/token | Cookie httpOnly + BFF; nunca token no cliente. |
| R6 Login 500 vs 401 | ✅ Corrigido no backend (401 real). Frontend mantém "não-2xx = inválido" como rede de segurança. |
| R7 LGPD | Não logar PII; mascarar dados sensíveis em telas/prints. |
| R8 Backend evoluindo | `features/*/api.ts` isola contratos; mocks p/ telas dependentes (#5). Confirmado na prática: backend ganhou login Google + `profileComplete` sem aviso prévio — schemas Zod absorveram o campo novo sem quebrar. |
| R9 (novo) Perfil incompleto (403) | Contas com `profileComplete: false` só acessam perfil no backend. Telas da Fase 3/4 precisam checar `session.user.profileComplete` antes de assumir acesso pleno. |

---

## 8. Resumo — arquivos desta spec

**✅ Criados (Autenticação + Shell):** `features/auth/{schemas.ts,components/{login-form,brand-panel,profile-card}.tsx}`,
`lib/auth/{config,session}.ts`, `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`,
`app/api/[...proxy]/route.ts`, `middleware.ts`, `app/(auth)/{layout.tsx,login/page.tsx}`,
`app/(app)/layout.tsx`, `components/layout/{app-shell,sidebar-nav,topbar,page-header}.tsx`,
`components/shared/{loading,empty,error}-state.tsx`, `components/ui/{dropdown-menu,sheet,skeleton}.tsx`,
stubs `app/(app)/psicologo/*` e `app/(app)/paciente/*` (placeholder, exceto `perfil/`).

**✅ Modificados:** `lib/api/client.ts` (base dupla server/browser + interceptor 401 →
`signOut()`/toast), `lib/constants.ts` (rotas + nav por perfil + `RISK_BANDS` na paleta
ordinal do §4), `app/providers.tsx` (`SessionProvider`, retry sem 4xx), `components/brand/logo.tsx`
(`variant="dark"`). Removido `components/theme-toggle.tsx` (morto desde a remoção do dark mode).

**✅ Criados desde a última atualização:** `features/{patients,questionnaires,results}/{schemas,api}.ts`
+ `components/`, `components/charts/gauge.tsx`, conteúdo real de
`app/(app)/psicologo/{dashboard,pacientes,avaliacoes,avaliacoes/[id],avaliacoes/[id]/pacientes/[pid]}`.

**⏳ Ainda por criar:** `app/(app)/psicologo/pacientes/[id]/` (gap da Fase 3), conteúdo real de
`app/(app)/psicologo/relatorios` e `app/(app)/paciente/{inicio,resultados}` (Fase 5/4),
`app/(app)/paciente/questionarios/[id]/responder/`, `stores/wizard-store.ts`,
`components/charts/{domain-bars,trend-line}.tsx`.

**Pré-requisitos de backend a pleitear (PRD §10):** refresh token, `GET /me`, score por escala +
risco, endpoints escopados ao paciente, OpenAPI, CORS restrito (~~login 500→401~~ já corrigido).

**Entrega até aqui:** login real (Auth.js + BFF) testado em produção, shell autenticado completo
com nav por perfil, **núcleo clínico do psicólogo completo e em produção** (dashboard, CRUD
pacientes, avaliações + resultado com gauge). **Falta:** perfil individual do paciente
(`pacientes/[id]`), paciente respondendo fim-a-fim (Fase 4), base de analytics (Fase 5).
