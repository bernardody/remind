# Spec 04 — Implementação da Aplicação Autenticada

> Spec de implementação derivada do PRD ([`02-frontend-prd.md`](02-frontend-prd.md)).
> Cobre **Autenticação (Fase 2)**, **Dashboard do Psicólogo (Fase 3)**,
> **Fluxo do Paciente (Fase 4)** e **Resultados & Analytics (Fase 5)**.
> **Pré-requisito:** Fundação (Fase 0) da [Spec 03](03-spec-landing.md) já implementada.
> **Status:** Fase 2 (Autenticação), Fase 3 (Dashboard do Psicólogo), Fase 4 (Fluxo do
> Paciente) e Fase 5a (score por escala + faixa de risco) **completas**. Fase 5b
> (evolução longitudinal / `trend-line.tsx`) **adiada deliberadamente** — decisão de produto,
> ver §6. Contratos baseados no código real em `/api`.

### Status de implementação (atualizado 2026-07-12 — redesign de UI/UX, Fases 1-3 da
[Spec 06](06-spec-redesign-ui.md), implementado e commitado localmente — **deploy ainda
não confirmado**)

| Parte | Status |
|---|---|
| Autenticação (Fase 2) — Auth.js, BFF proxy, middleware, tela de login | ✅ Implementado, testado com backend real, em produção |
| Shell da aplicação (sidebar, topbar, page-header, loading/empty/error state) | ✅ Implementado, em produção |
| Dashboard do Psicólogo (Fase 3) — cards de visão geral | ✅ Implementado, em produção |
| Pacientes (Fase 3) — lista paginada + CRUD (`patients-view.tsx`) | ✅ Implementado, em produção |
| Pacientes (Fase 3) — perfil individual (`pacientes/[id]`, dados + avaliações respondidas) | ✅ Implementado, em produção — validado com `curl` contra a API real (200/404) |
| Avaliações (Fase 3) — lista + detalhe + quem respondeu + resultado (gauge) | ✅ Implementado, em produção |
| Relatórios (Fase 3 na spec original, mas depende da Fase 5) | ⏳ Placeholder mantido — depende de evolução longitudinal (Fase 5b, adiada), não do breakdown por escala (Fase 5a, já pronto) |
| Perfil (psicólogo/paciente) | ✅ Implementado (lê nome/email/tipo do JWT) |
| Fluxo do Paciente (Fase 4: `inicio/`, wizard de resposta) | ✅ Implementado, deployado e testado em produção — incluindo os 3 ajustes pós-teste (ver §5). Paciente não vê mais resultado próprio (`resultados/` removida) |
| Resultados & Analytics (Fase 5a: `domain-bars.tsx`, breakdown por escala + faixa de risco) | ✅ Implementado, deployado e testado em produção |
| Resultados & Analytics (Fase 5b: `trend-line.tsx`, evolução longitudinal) | ⏳ Adiada deliberadamente (decisão de produto) — ver §6 |
| Deploy produção (Vercel: env vars) + backend VPS (schema + `GOOGLE_CLIENT_ID`) | ✅ Estabilizado, inclusive Fase 5a — com 1 incidente no meio do caminho (ver R12 no §7): push na `main` disparou deploy automático do `/api` (webhook EasyPanel) **antes** da migração de schema ser aplicada em prod, derrubando o backend inteiro por ~alguns minutos (`SchemaManagementException: missing table`). Corrigido aplicando a migração via pgweb contra o `remind_db` já em produção, sem rollback de código — resolvido no mesmo dia |
| Redesign de UI/UX (design system + telas, [Spec 06](06-spec-redesign-ui.md) Fases 1-3) | ✅ Implementado, verificado (`typecheck`/`lint`/`test`/`build` limpos) e commitado localmente. Login validado ponta a ponta contra backend+Postgres locais (skill `verify`). **Sem alteração de schema/backend** — é frontend puro, sem o risco do R12. Fase 4 (busca real, edição de perfil, filtro por escala) fica bloqueada em pré-requisitos de backend, não iniciada. **Deploy em produção ainda não confirmado nesta sessão** |

**Fase 3: ✅ completa.** Todas as telas de `app/(app)/psicologo/` estão reais em produção,
exceto `relatorios/` (depende da Fase 5, fora de escopo aqui).

**Fase 4: ✅ completa, deployada e testada em produção (2026-07-11).** Wizard de resposta e
`inicio/` (avaliações disponíveis) verificados ponta a ponta localmente antes do deploy — login
real via Auth.js, sessão httpOnly, BFF, SSR — e depois validados pelo usuário em produção no
mesmo dia. Precisou de 1 endpoint novo no backend, auto-escopado ao paciente autenticado via JWT
(sem `patientId` na URL, diferente do padrão psicólogo→paciente da Fase 3):
`GET /questionarios/respondidos` (o segundo endpoint criado, `GET /questionarios/{id}/resultado`,
sobrevive só como checagem de existência — ver abaixo). Ver §0 e §5.

O primeiro teste em produção revelou 3 problemas: (1) decisão de produto revertida — paciente
não vê o próprio resultado, a tela `resultados/` foi removida; (2) timezone do container 3h
adiantado (fix no `Dockerfile`); (3) paciente conseguia reabrir e refazer um questionário já
respondido (bloqueio adicionado na entrada da página, não só no envio). Corrigidos, deployados
e **retestados em produção com sucesso** — Fase 4 sem pendências. Detalhes em §5.

---

## 0. Contrato real da API (validado no código)

Base: `API_URL` (server/BFF) · `https://api.remindapp.com.br` prod · `localhost:8080` dev.
Auth: Bearer JWT RS256, `expiresIn: 600s`. **Sem refresh, sem `/me`** (PRD §3).

| Método | Rota | DTO resposta (campos reais) |
|---|---|---|
| POST | `/login` | `{ accessToken, expiresIn, type: "PSYCHOLOGIST"\|"PATIENT", profileComplete: boolean }` |
| GET | `/pacientes` | `Page<{ id, name, email, phone, birthDate, gender(char), createdAt, active }>` |
| GET | `/pacientes/{id}` | mesmo shape do item da lista (`ListPatientResponse`), escopado ao psicólogo autenticado — 404 se o paciente não existe ou pertence a outro psicólogo |
| GET | `/pacientes/{id}/avaliacoes` | `Page<{ questionnaireId, questionnaireTitle, answeredAt }>` — avaliações respondidas por esse paciente, escopado ao psicólogo autenticado |
| POST | `/pacientes` | body: `{ name, email, cpf, phone, password, birthDate, gender }` |
| PUT | `/pacientes/{id}` | `UpdatePatientResponse` |
| DELETE | `/pacientes/{id}` | 204 |
| GET | `/questionarios` | `Page<QuestionnaireResponse>` |
| GET | `/questionarios/{id}` | `{ id, title, created_at, updated_at, active, questions[] }` onde `questions[] = { id, scale{id,name,...}, text, order_number, options[]{ id, name, value } }` |
| POST | `/questionarios/{id}/responder` | body: `{ responses: [{ questionId, questionOptionId }] }` — 409 se o paciente autenticado já respondeu este questionário (ver nota abaixo) |
| GET | `/questionarios/{id}/pacientes` | `Page<{ patientId, patientName, answeredAt }>` |
| GET | `/questionarios/{id}/pacientes/{pid}/respostas` | `{ questionnaireAnswerId, patientName, questionnaireTitle, answeredAt, responses[]{ questionId, questionText, chosenOption, chosenValue } }` |
| GET | `/questionarios/{id}/pacientes/{pid}/resultado` | `{ questionnaireAnswerId, patientName, questionnaireTitle, average, answeredAt, scaleResults[] }` (Fase 5a) — escopado ao **psicólogo** autenticado (404 se `patientId` não é seu). `scaleResults[] = { scaleId, scaleName, average, riskLabel }`, um item por escala presente no questionário (`average` continua sendo a média global, inalterado) |
| GET | `/questionarios/respondidos` | **(novo, Fase 4)** `Page<{ questionnaireId, questionnaireTitle, answeredAt }>` — auto-serviço do **paciente** autenticado (via JWT, sem `patientId` na URL); equivalente de `/pacientes/{id}/avaliacoes` mas do ponto de vista do próprio paciente |
| GET | `/questionarios/{id}/resultado` | **(novo, Fase 4)** mesmo shape do endpoint acima com `pacientes/{pid}`, mas escopado ao **paciente** autenticado via JWT — 404 se ele mesmo não respondeu. Frontend do paciente usa isso só como checagem de existência (200/404) pra bloquear reentrada no wizard — o `average` da resposta nunca é exibido pro paciente (ver §5, decisão de produto) |

> ✅ **Fase 5a — breakdown por escala + faixa de risco.** `GetPatientQuestionnaireResultResponse`
> ganhou `scaleResults[]` (ver linha acima). Antes disso o cálculo (`QuestionnaireResultCalculator`)
> só produzia 1 `average` global misturando **todas** as escalas do questionário — sem sentido
> clínico, já que o questionário seed tem 3 escalas distintas (CARS/UCLA/SPI) na mesma lista de
> perguntas. Agora agrupa `PatientQuestionResponse` por `Question.scale`, calcula 1 média por
> escala e classifica o risco (Baixo/Moderado/Alto) contra a tabela nova `scale_risk_bands`
> (thresholds por escala, seed manual — ver `api/data/insert.sql`, cortes placeholder tipo
> tercis 0–2/2–3.5/3.5–5, mesmos da paleta ordinal do §4, até haver cortes clínicos reais por
> escala). Persistido em `questionnaire_scale_results` (1 linha por escala por resposta),
> calculado 1x no momento da resposta (mesmo padrão do `average` global), não recalculado na
> leitura. `riskLabel` fica `null` se a escala não tiver faixas cadastradas (degrade graceful —
> frontend mostra "Sem faixa" em vez de quebrar). O endpoint do **paciente**
> (`GET /questionarios/{id}/resultado`) usa o mesmo mapper e passou a incluir `scaleResults`
> também, mas o frontend do paciente continua ignorando o corpo da resposta inteiro (decisão de
> produto da Fase 4: paciente não vê resultado, só o status 200/404 importa).
> ✅ **Corrigido durante a Fase 4**: `AnswerQuestionnaireService` não impedia um paciente de
> responder o mesmo questionário mais de uma vez — a 2ª resposta quebrava com 500
> ("query did not return a unique result") tanto o `/resultado` do psicólogo quanto o novo
> self-service, porque `findByPatientAndQuestionnaire` assume no máximo 1 resposta por par
> paciente/questionário. Agora `POST /responder` rejeita com `409` se já existe resposta.
> Bug pré-existente (a query já existia desde a Fase 3), só descoberto ao verificar o wizard
> ponta a ponta — antes só o psicólogo podia disparar esse endpoint, e ele não controla quantas
> vezes o paciente responde.
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

## 4. Dashboard do Psicólogo (Fase 3) ✅ COMPLETA

> **Status:** todas as telas de `app/(app)/psicologo/` estão implementadas e em produção,
> exceto `relatorios/` (placeholder deliberado — depende da Fase 5). O gap `pacientes/[id]/`
> foi fechado: exigiu 2 endpoints novos no backend (`GET /pacientes/{id}` e
> `GET /pacientes/{id}/avaliacoes`, escopados ao psicólogo autenticado — ver §0), já que o
> `PatientController` só tinha lista/insert/update/delete e não existia consulta "avaliações
> respondidas por este paciente" no sentido inverso ao que já existia por questionário.
> Validado em produção via `curl` (200 pra paciente existente, 404 pra inexistente/de outro
> psicólogo, lista paginada de avaliações). Também corrigido nesta fase: bug de `BASE_URL`/
> `buildUrl` que impedia `/pacientes` e `/questionarios` de carregar no browser
> (`new URL()` sem base explícita lançava `Invalid URL` antes do fetch — `lib/api/client.ts`),
> e validação de `cpf`/`phone` no form de paciente que estourava `VARCHAR(11)` do Postgres
> quando digitados com pontuação (`features/patients/schemas.ts`).

```
app/(app)/psicologo/
├── dashboard/page.tsx      ✅ real (cards de contagem via /pacientes, /questionarios)
├── pacientes/page.tsx      ✅ real (CRUD completo, TanStack Table)
├── pacientes/[id]/page.tsx ✅ real (dados + avaliações respondidas)
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
| `pacientes/[id]/` | RF-14/16 | ✅ Perfil do paciente: `PatientInfoCard` (dados) + `PatientQuestionnairesTable` (avaliações respondidas, link "Ver resultado" pra `avaliacoes/[id]/pacientes/[pid]`). Link de acesso via "Ver detalhes" no menu de ações de `pacientes/`. |
| `avaliacoes/` | RF-15 | ✅ Lista de questionários (`/questionarios`). |
| `avaliacoes/[id]/` | RF-15 | ✅ Detalhe do questionário + lista de quem respondeu (`/questionarios/{id}/pacientes`). |
| `avaliacoes/[id]/pacientes/[pid]/` | RF-16 | ✅ Respostas detalhadas (`/respostas`) + resultado (`/resultado`): escore global via **gauge (Recharts)** + breakdown por escala via **`domain-bars.tsx`** (Fase 5a, condicional a `scaleResults.length > 0`). `trend-line.tsx` (Fase 5b, longitudinal) segue adiado. |
| `relatorios/` | RF-17 | ⏳ Evolução longitudinal / comparativos por escala — **condicionado a dados do backend**; placeholder com aviso "em breve" mantido até a Fase 5. |
| `perfil/` | RF-20 | ✅ Dados do usuário logado (do JWT) via `ProfileCard`. Segurança (trocar senha etc.) ainda pendente — sem endpoint no backend. |

> ⚠️ **Perfil incompleto (backend):** contas de psicólogo com `profileComplete: false`
> (criadas via Google, ou seeds antigos sem a coluna migrada) têm o token restrito pelo
> backend — endpoints além de perfil retornam `403`. Ao implementar as telas acima, tratar
> esse caso (ex.: banner "complete seu perfil" + bloqueio), hoje fora do escopo desta spec.

### Componentes de visualização (`components/charts/`)

`gauge.tsx` ✅ (escore geral), `domain-bars.tsx` ✅ (Fase 5a — barras por escala + nível
Baixo/Moderado/Alto vindo do backend via `riskLabel`, `getRiskBandByLabel` em `lib/constants.ts`),
`trend-line.tsx` ⏳ (Fase 5b, evolução temporal — adiada). Recharts.
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

## 5. Fluxo do Paciente (Fase 4) ✅ COMPLETA, deployada e testada em produção — sem pendências

> **Status:** todas as telas de `app/(app)/paciente/` estão implementadas. O gap de "rotas
> exigem `patientId` explícito" (PRD §3 #5) foi fechado do mesmo jeito que a Fase 3 fechou o
> equivalente pro psicólogo: endpoint novo no backend, mas aqui auto-escopado via JWT (sem
> `patientId` na URL, porque quem chama já É o paciente) — `GET /questionarios/respondidos`
> (ver §0). Verificado ponta a ponta localmente (Postgres isolado, login real via Auth.js, BFF,
> SSR), depois deployado e testado pelo usuário em produção em 2026-07-11 — o teste real revelou
> os 3 problemas corrigidos abaixo, que foram deployados e **retestados em produção com
> sucesso** no mesmo dia.
>
> ⚠️ **Decisão de produto (revertida após teste em produção, 2026-07-11): paciente NÃO vê
> resultado próprio.** O fluxo original desta spec incluía `resultados/` (histórico + resultado
> individual com gauge) — foi **removido**. O paciente só entra, responde e sai; quem vê o
> escore é o psicólogo (Fase 3). `GET /questionarios/{id}/resultado` continua existindo no
> backend (não foi removido, é inofensivo ficar parado), só não tem mais nenhum consumidor no
> frontend do paciente — a checagem de "já respondeu" usa esse mesmo endpoint (só o status
> 200/404 importa, o `average` da resposta é ignorado).

```
app/(app)/paciente/
├── inicio/page.tsx                        ✅ real (lista de avaliações via /questionarios,
│                                              marca "Já respondido" via /questionarios/respondidos)
├── questionarios/[id]/responder/page.tsx  ✅ real (wizard completo; bloqueia reentrada se já
│                                              respondido, ver nota abaixo)
└── perfil/page.tsx                        ✅ real (ProfileCard, dados do JWT)
```

| Tela | RF | O que conter |
|---|---|---|
| `inicio/` | RF-18 | ✅ Lista de avaliações via `/questionarios` (`AvailableQuestionnaires`). O backend não escopa "atribuídas a este paciente" — lista todas as ativas, sem fingir um status "pendente" que não há dado pra sustentar. Mas "já respondido" a gente sabe (via `/questionarios/respondidos`) — mostra label em vez do botão "Responder"; inativas mostram "Indisponível". |
| `questionarios/[id]/responder/` | RF-18 | ✅ **Wizard** (`QuestionnaireWizard`): 1 pergunta/passo (`question-step.tsx`, opções como cards selecionáveis, sem Radix RadioGroup), barra de progresso (`progress-bar.tsx`), navegação prev/next, revisão antes de enviar (`review-step.tsx`, com "Editar" por pergunta) e confirmação (`confirmation.tsx`). Estado em **Zustand** (`stores/wizard-store.ts`). Envia `POST /responder`; backend rejeita 2ª resposta com `409` (ver §0). **Bloqueio também no carregamento da página** (não só no envio): o server component checa `GET /questionarios/{id}/resultado` antes de renderizar — 200 (já respondeu) mostra tela "Questionário já respondido" em vez do wizard; sem essa checagem o paciente conseguia abrir e marcar tudo de novo, só sendo barrado ao clicar em "Enviar". |
| `perfil/` | RF-20 | ✅ Dados pessoais via `ProfileCard` (dados do JWT). Segurança (trocar senha) ainda pendente — sem endpoint no backend. |

| Arquivo extra | O que conter |
|---|---|
| `stores/wizard-store.ts` | ✅ Zustand: `questionnaireId`, `currentStep`, `answers` (respostas em progresso). `start()` só reseta se o paciente mudou de questionário — recarregar a página no meio do fluxo não perde respostas. |
| `features/questionnaires/components/wizard/*` | ✅ `question-step.tsx`, `progress-bar.tsx`, `review-step.tsx`, `confirmation.tsx`, `questionnaire-wizard.tsx` (orquestrador). |

### Timezone (achado em produção, 2026-07-11)

Horários gravados pelo backend (`answered_at` etc., todos `LocalDateTime.now()`) saíam 3h
adiantados em produção — o container roda `eclipse-temurin:21-jre-alpine`, que por padrão usa
UTC, e `LocalDateTime.now()` usa o timezone default da JVM. Corrigido no `api/Dockerfile`:
`ENTRYPOINT ["java", "-Duser.timezone=America/Sao_Paulo", "-jar", "app.jar"]`. Reproduzido e
confirmado localmente forçando a JVM pra UTC vs. `America/Sao_Paulo` e comparando contra o
horário real. Timestamps já gravados em produção antes da correção continuam com o desvio de
3h — não foram corrigidos retroativamente (fora de escopo, não pedido).
| `features/questionnaires/components/{available-questionnaires,my-answered-questionnaires}.tsx` | ✅ Listas de `inicio/` e `resultados/`. |

---

## 6. Resultados & Analytics (Fase 5)

### 5a. Score por escala + faixa de risco ✅ COMPLETA (backend + frontend, deploy pendente)

Decisões de escopo tomadas com o usuário ao iniciar a fase: (1) mostrar a média final global
**e** a média de cada escala lado a lado (não substituir uma pela outra); (2) faixas de risco em
tabela nova por escala, com seed manual de placeholder (não hardcode no Java, não adiado); (3)
evolução longitudinal fica pra depois (ver 5b).

**Backend** (schema novo, ver `api/data/schema.sql`/`insert.sql`):
- `scale_risk_bands` (`id_scale` FK, `label`, `min_value`, `max_value`) — thresholds por escala.
  Seed atual (`insert.sql`) usa cortes placeholder (tercis 0–2/2–3.5/3.5–5, mesmos 3 níveis já
  usados no frontend) pras 3 escalas existentes (CARS/UCLA/SPI) — **trocar pelos cortes clínicos
  reais quando definidos**, é só UPDATE nas linhas, sem migração de schema.
- `questionnaire_scale_results` (`id_questionnaire_result` FK, `id_scale` FK, `average`,
  `risk_label`) — 1 linha por escala por resposta, calculada 1x em `QuestionnaireResultCalculator`
  (junto do `average` global, que não mudou) e nunca recalculada na leitura.
- `QuestionnaireResultCalculator` reescrito: agrupa `PatientQuestionResponse` por
  `Question.scale`, calcula 1 média por grupo, classifica contra `ScaleRiskBandRepository`
  (`null` se a escala não tiver faixa cadastrada). **Classificação por piso, não por
  intervalo:** a faixa escolhida é a de maior `min_value` que a média atinge — não compara
  contra `max_value`. Achado em teste manual ponta a ponta (Postgres real, paciente
  respondendo "Sempre"/"Concordo totalmente" em tudo de uma escala, `average = 5.00`): com
  faixas `min`/`max` e limite superior exclusivo (`average < max_value`), a nota máxima
  possível da escala nunca bateria a condição do maior nível ("Alto", `max_value = 5`), e
  ficaria sem classificação nenhuma (`riskLabel = null`). `max_value` continua no schema como
  metadado descritivo, só não entra na comparação.
- `GetPatientQuestionnaireResultResponse` ganhou `scaleResults[]` (`scaleId`, `scaleName`,
  `average`, `riskLabel`); mesmo mapper serve tanto o endpoint do psicólogo quanto o do paciente
  (que ignora o campo, ver §0).

**Frontend:**
- `features/results/schemas.ts`: `ScaleResultSchema` novo, `PatientResultSchema.scaleResults`.
- `components/charts/domain-bars.tsx` (novo): barra por escala (Recharts) + lista textual com
  nível de risco (nunca só cor, mesma regra do `gauge.tsx`/`RISK_BANDS` do §4).
- `lib/constants.ts`: `getRiskBandByLabel(label)` novo — mapeia o `riskLabel` do backend
  (string) pra cor/label da paleta ordinal (`getRiskBand(average)`, que já existia, continua
  servindo só o gauge do escore global).
- `avaliacoes/[id]/pacientes/[pid]/page.tsx`: renderiza `<DomainBars>` num card novo entre o
  gauge e a lista de respostas, condicional a `scaleResults.length > 0` (resultados antigos —
  respondidos antes desta fase — não têm `questionnaire_scale_results`, então o card não
  aparece pra eles em vez de mostrar vazio).

**⚠️ Pendente antes do deploy:** aplicar `scale_risk_bands` e `questionnaire_scale_results`
(schema + seed) no Postgres de produção — `ddl-auto: validate` não cria tabela nenhuma sozinho
(mesma mecânica do incidente de schema drift já documentado nesta spec). Sem isso, o boot do
`/api` em prod falha a validação do Hibernate contra o schema real.

### 5b. Evolução longitudinal (`trend-line.tsx`) ⏳ Adiada deliberadamente

Decisão consciente ao escopar a Fase 5: fora desta rodada (confirmado de novo em 2026-07-11 ao
cogitar iniciar a 5b — usuário decidiu adiar mais uma vez). Hoje **não há como** ter série
temporal por questionário único — `AnswerQuestionnaireService` rejeita uma 2ª resposta ao mesmo
questionário com `409` (ver R10 no §7), regra ligada à unicidade assumida por
`findByPatientAndQuestionnaire`.

**Caminho escolhido pra quando a 5b for retomada:** questionários novos por escala, **não**
relaxar o `409`. Cada "reaplicação" ao longo do tempo (ex. mensal) é um `Questionnaire` novo
cujas perguntas apontam pra mesma `Scale` — agrega por `Scale` através de múltiplos
`Questionnaire`s (o modelo de dados já suporta isso, `Question.scale` é uma FK livre, não há
conceito de "1 escala = 1 questionário"). Não mexe no bloqueio de reentrada do wizard nem na
regra de resposta única por questionário da Fase 4, já testada em produção — menor risco de
regressão que relaxar o `409`.

**Escopo real da 5b quando retomada, então, inclui duas partes:**
1. Tela nova pro **psicólogo criar questionários** (hoje não existe — `Questionnaire`/`Question`/
   `Scale`/`QuestionOption` só são alimentados via SQL direto, sem CRUD nenhum, ver §1). Sem
   isso não há como o psicólogo de fato "reaplicar" uma escala mês a mês.
2. Agregação + `trend-line.tsx`: query que junte `QuestionnaireScaleResult` de um paciente por
   `Scale` (não por `Questionnaire`), ordenada por `answered_at`, pra mostrar a progressão
   mensal pedida pelo usuário ("ver a progressão entre os meses do paciente").

Nenhuma das duas partes foi iniciada.

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
| R9 (novo) Perfil incompleto (403) | Contas com `profileComplete: false` só acessam perfil no backend. Telas da Fase 3/4 precisam checar `session.user.profileComplete` antes de assumir acesso pleno. Não é relevante pro paciente na prática — contas de paciente nascem sempre com senha (sem fluxo Google), `profileComplete` sempre `true`. |
| R10 (novo, Fase 4) Resposta duplicada quebrava resultado | `findByPatientAndQuestionnaire` assumia no máximo 1 resposta por par paciente/questionário; sem essa checagem, responder 2x derrubava `/resultado` (psicólogo e paciente) com 500. Descoberto ao verificar o wizard ponta a ponta — corrigido com `409` em `AnswerQuestionnaireService` na 2ª tentativa. |
| R11 (novo, Fase 4) Timezone do container | Container roda em UTC por padrão (imagem Alpine), gravando `LocalDateTime.now()` 3h adiantado do horário de Brasília real. Achado em produção pelo usuário. Corrigido fixando `-Duser.timezone=America/Sao_Paulo` na JVM (`Dockerfile`), não no código — `LocalDateTime` em si não carrega timezone. |
| R12 (novo, Fase 5a) Deploy exige migração manual de schema | **Materializado em produção em 2026-07-11.** `scale_risk_bands`/`questionnaire_scale_results` são tabelas novas; `ddl-auto: validate` em prod não as cria sozinho. O commit foi enviado pra `main` antes da migração ser aplicada — o webhook do EasyPanel disparou o deploy automático do `/api` na hora, e o backend inteiro ficou em crash loop (`SchemaManagementException: Schema validation: missing table [questionnaire_scale_results]`, `502` em `api.remindapp.com.br`, login quebrado pra **todo mundo**, não só um usuário). Corrigido rodando a migração adicional (só `CREATE TABLE`/`ALTER TABLE`/`INSERT`, sem `DROP`) direto no `remind_db` via **pgweb** (console SQL já exposto no EasyPanel, mesma ferramenta usada pra aplicar o schema original) — sem precisar reverter o deploy. **Lição:** daqui pra frente, qualquer mudança de schema precisa ser aplicada no Postgres de produção *antes* do push pra `main`, nunca depois — o deploy automático não dá esse tempo de folga. |

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
`app/(app)/psicologo/{dashboard,pacientes,pacientes/[id],avaliacoes,avaliacoes/[id],avaliacoes/[id]/pacientes/[pid]}`.
No backend: `GetPatientService`, `ListPatientQuestionnairesService`,
`ListPatientQuestionnaireResponse`, `ListPatientQuestionnaireMapper` + rotas novas no
`PatientController` (`GET /pacientes/{id}`, `GET /pacientes/{id}/avaliacoes`).

**✅ Criados nesta atualização (Fase 4):** `stores/wizard-store.ts`,
`features/questionnaires/components/wizard/{question-step,progress-bar,review-step,confirmation,questionnaire-wizard}.tsx`,
`features/questionnaires/components/available-questionnaires.tsx`,
`app/(app)/paciente/questionarios/[id]/responder/page.tsx`.
No backend: `ListMyQuestionnairesService`, `GetMyQuestionnaireResultService` + rotas novas no
`QuestionnaireController` (`GET /questionarios/respondidos`, `GET /questionarios/{id}/resultado`).

**✅ Modificados nesta atualização:** `app/(app)/paciente/inicio/page.tsx` (de placeholder pra
real, com marcação "Já respondido"), `features/questionnaires/{schemas,api}.ts`
(+`AnswerQuestionnaireRequest/Response`, `MyAnsweredQuestionnaire`, `useAnswerQuestionnaire`,
`useMyAnsweredQuestionnaires`), `lib/constants.ts` (+`ROUTES.paciente.responder`, nav sem
"Resultados"). No backend: `AnswerQuestionnaireService` (rejeita resposta duplicada com 409 —
ver §7 R10); `QuestionnaireResultCalculator` movido de `calculator/` pra
`calculator/questionnaire/` (o arquivo já declarava esse package — mismatch causava
`ConflictingBeanDefinitionException` em builds incrementais sem `clean`, descoberto ao rodar o
backend localmente pra verificação); `Dockerfile` (`-Duser.timezone=America/Sao_Paulo`, ver §5).

**❌ Removidos após teste em produção (2026-07-11):** `app/(app)/paciente/resultados/` (lista +
`[id]/`), `features/questionnaires/components/my-answered-questionnaires.tsx`,
`features/results/api.ts#useMyQuestionnaireResult`, `ROUTES.paciente.{resultados,resultadoDetalhe}`,
item "Resultados" do `PATIENT_NAV` — decisão de produto: paciente não vê o próprio resultado.

**✅ Criados/modificados nesta atualização (Fase 5a):** backend —
`domain/{ScaleRiskBand,QuestionnaireScaleResult}.java`,
`repository/{ScaleRiskBandRepository,QuestionnaireScaleResultRepository}.java`,
`calculator/questionnaire/QuestionnaireResultCalculator` (reescrito, agrupa por escala),
`controller/response/questionnaire/GetPatientQuestionnaireResultResponse` (+`scaleResults[]`),
`mapper/questionnaire/GetPatientQuestionnaireResultMapper` (+parâmetro de lista),
`service/questionnaire/{GetPatientQuestionnaireResultService,GetMyQuestionnaireResultService}`
(injetam o repo novo), `api/data/{schema.sql,insert.sql}` (2 tabelas novas + seed de faixas).
Frontend — `components/charts/domain-bars.tsx` (novo), `features/results/schemas.ts`
(+`ScaleResultSchema`), `lib/constants.ts` (+`getRiskBandByLabel`),
`app/(app)/psicologo/avaliacoes/[id]/pacientes/[pid]/page.tsx` (renderiza `DomainBars`).
Testes existentes (29, `mvnw test`) e typecheck/lint do frontend passam sem alteração.

**⏳ Ainda por criar:** `components/charts/trend-line.tsx` e conteúdo real de
`app/(app)/psicologo/relatorios` — ambos dependem da Fase 5b (longitudinal), adiada
deliberadamente (ver §6).

**Pré-requisitos de backend a pleitear (PRD §10):** refresh token, `GET /me`, ~~score por
escala + risco~~ já implementado nesta atualização (Fase 5a), série temporal (Fase 5b), OpenAPI,
CORS restrito (~~login 500→401~~ já corrigido; ~~endpoints escopados ao paciente~~ já resolvido
na Fase 4 pras rotas de avaliação — `/pacientes/*` do psicólogo continua sem equivalente pro
paciente ver os PRÓPRIOS dados de perfil via API dedicada, mas isso já é coberto pelo JWT
decodificado).

**Entrega até aqui:** login real (Auth.js + BFF) testado em produção, shell autenticado completo
com nav por perfil, **Fase 3 completa e em produção** (dashboard, CRUD pacientes, perfil
individual do paciente, avaliações + resultado com gauge), **Fase 4 completa, deployada e
testada em produção, sem pendências** (paciente respondendo fim-a-fim: lista de avaliações,
wizard; paciente NÃO vê resultado próprio — decisão de produto), **Fase 5a completa** (score
por escala + faixa de risco, backend e frontend prontos, **deploy pendente** — precisa migrar
schema em prod antes, ver R12). **Falta:** Fase 5b (evolução longitudinal, adiada por decisão
de produto).
