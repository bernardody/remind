# Spec 04 — Implementação da Aplicação Autenticada

> Spec de implementação derivada do PRD ([`02-frontend-prd.md`](02-frontend-prd.md)).
> Cobre **Autenticação (Fase 2)**, **Dashboard do Psicólogo (Fase 3)**,
> **Fluxo do Paciente (Fase 4)** e **Resultados & Analytics (Fase 5)**.
> **Pré-requisito:** Fundação (Fase 0) da [Spec 03](03-spec-landing.md) já implementada.
> **Status:** pronta para implementação. Contratos baseados no código real em `/api`.

---

## 0. Contrato real da API (validado no código)

Base: `API_URL` (server/BFF) · `https://api.remindapp.com.br` prod · `localhost:8080` dev.
Auth: Bearer JWT RS256, `expiresIn: 600s`. **Sem refresh, sem `/me`** (PRD §3).

| Método | Rota | DTO resposta (campos reais) |
|---|---|---|
| POST | `/login` | `{ accessToken, expiresIn, type: "PSYCHOLOGIST"\|"PATIENT" }` |
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
> ⚠️ **Login 500 em vez de 401** com credencial errada (PRD R6) → tratar 500 do `/login` como inválido.

---

## 1. Camada de API por feature (`features/`)

Estende o `lib/api/client.ts` da Fase 0. Cada feature: `schemas.ts` (Zod, valida resposta),
`api.ts` (hooks TanStack Query), `components/`.

| Arquivo | O que conter |
|---|---|
| `features/auth/schemas.ts` | `LoginRequest`, `LoginResponse`, enum `UserType`. |
| `features/patients/schemas.ts` | `Patient`, `InsertPatient`, `UpdatePatient`, `PagePatient`. |
| `features/patients/api.ts` | `usePatients(pageable)`, `useCreatePatient`, `useUpdatePatient`, `useDeletePatient` (com invalidação de cache). |
| `features/questionnaires/schemas.ts` | `Questionnaire`, `QuestionnaireDetail`, `Question`, `Option`, `AnswerRequest`. |
| `features/questionnaires/api.ts` | `useQuestionnaires`, `useQuestionnaire(id)`, `useAnswerQuestionnaire`, `useQuestionnairePatients(id)`. |
| `features/results/schemas.ts` | `PatientAnswers`, `PatientResult`. |
| `features/results/api.ts` | `usePatientAnswers(qid, pid)`, `usePatientResult(qid, pid)`. |

---

## 2. Autenticação (Fase 2) — BFF + cookie httpOnly

Estratégia PRD §6: Auth.js Credentials + Route Handlers como proxy; token em cookie httpOnly
(não localStorage → mitiga XSS, R5).

### Arquivos a criar

| Arquivo | RF | O que conter |
|---|---|---|
| `lib/auth/config.ts` | — | Auth.js: Credentials provider chama `POST /login`; persiste `accessToken`/`type`/`expiresIn` no JWT da sessão (cookie httpOnly). |
| `app/api/auth/[...nextauth]/route.ts` | RF-11 | Handlers Auth.js. |
| `app/api/[...proxy]/route.ts` (BFF) | RF-12 | Proxy que anexa `Authorization: Bearer` (do cookie) às chamadas ao backend; em **401 (ou 500 no login)** sinaliza sessão expirada. |
| `app/(auth)/layout.tsx` | — | Layout centrado, branding. |
| `app/(auth)/login/page.tsx` | RF-11 | Form email+senha (RHF+Zod). Trata **500 como credencial inválida** (R6). Sucesso → redirect por `type` (`PSYCHOLOGIST`→`/psicologo/dashboard`, `PATIENT`→`/paciente/inicio`). |
| `middleware.ts` | RF-12 | Protege `(app)/*`; redireciona não autenticado → `/login`; barra perfil errado por rota (psicólogo vs paciente). |
| `lib/auth/session.ts` | — | Helpers `getSession`, `requireRole`. |

> **Refresh ausente (R1):** sem refresh token no backend, 401 → logout + toast "sessão expirada,
> faça login novamente". Centralizar no client/BFF. Quando o backend expuser refresh, trocar aqui.
> **`/me` ausente:** usar `name`/`email`/`type` do JWT para header e escopo. Isolar em `session.ts`
> para migração futura a `GET /me`.

---

## 3. Shell da aplicação (`app/(app)/`)

| Arquivo | O que conter |
|---|---|
| `app/(app)/layout.tsx` | Guarda de sessão + shell: sidebar + topbar; nav condicional por `type`; menu de usuário (nome, logout); toggle dark mode. |
| `components/layout/sidebar.tsx` | Navegação por perfil. |
| `components/layout/topbar.tsx` | Breadcrumb/título + ações + avatar. |
| `components/layout/page-header.tsx` | Cabeçalho reutilizável de página. |
| `components/shared/{loading,empty,error}-state.tsx` | RF-21: skeletons, vazio e erro padronizados (usados em todas as telas). |

---

## 4. Dashboard do Psicólogo (Fase 3)

```
app/(app)/psicologo/
├── dashboard/page.tsx
├── pacientes/page.tsx
├── pacientes/[id]/page.tsx
├── avaliacoes/page.tsx
├── avaliacoes/[id]/page.tsx
├── avaliacoes/[id]/pacientes/[pid]/page.tsx
├── relatorios/page.tsx
└── perfil/page.tsx
```

| Tela | RF | O que conter |
|---|---|---|
| `dashboard/` | RF-13 | Cards de visão geral: nº de pacientes ativos (de `/pacientes`), avaliações recentes, atalhos. |
| `pacientes/` | RF-14 | **TanStack Table** + shadcn: lista paginada (Spring `Page`), busca, sort. Botão "Novo paciente" → dialog com form (`InsertPatientRequest`: name, email, cpf, phone, password, birthDate, gender) RHF+Zod. Editar/remover (confirm dialog). Navegação otimista + invalidação de cache. |
| `pacientes/[id]/` | RF-14/16 | Perfil do paciente: dados + avaliações respondidas. |
| `avaliacoes/` | RF-15 | Lista de questionários (`/questionarios`). |
| `avaliacoes/[id]/` | RF-15 | Detalhe do questionário + lista de quem respondeu (`/questionarios/{id}/pacientes`). |
| `avaliacoes/[id]/pacientes/[pid]/` | RF-16 | Respostas detalhadas (`/respostas`) + resultado (`/resultado`): escore via **gauge (Recharts)**. Componentes de breakdown por domínio **preparados mas ocultos/placeholder** até backend expor (R3). |
| `relatorios/` | RF-17 | Evolução longitudinal / comparativos por escala — **condicionado a dados do backend**; placeholder com aviso "em breve" se indisponível. |
| `perfil/` | RF-20 | Dados do usuário logado (do JWT) + segurança. |

### Componentes de visualização a criar (`components/charts/`)

`gauge.tsx` (escore geral), `domain-bars.tsx` (barras por domínio + nível Baixo/Moderado/Alto —
usa faixas de risco quando existirem), `trend-line.tsx` (evolução temporal). Recharts.
`features/patients/components/` e `features/results/components/` para tabelas/cards específicos.

---

## 5. Fluxo do Paciente (Fase 4)

```
app/(app)/paciente/
├── inicio/page.tsx
├── questionarios/[id]/responder/page.tsx
├── resultados/page.tsx
└── perfil/page.tsx
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
| R6 Login 500 vs 401 | Login trata 500 como credencial inválida. |
| R7 LGPD | Não logar PII; mascarar dados sensíveis em telas/prints. |
| R8 Backend evoluindo | `features/*/api.ts` isola contratos; mocks p/ telas dependentes (#5). |

---

## 8. Resumo — arquivos desta spec

**Criar:** `features/{auth,patients,questionnaires,results}/{schemas,api}.ts` + `components/`,
`lib/auth/{config,session}.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/[...proxy]/route.ts`,
`middleware.ts`, `app/(auth)/{layout,login}`, `app/(app)/layout.tsx`,
`components/layout/*`, `components/shared/*`, `components/charts/{gauge,domain-bars,trend-line}.tsx`,
telas `app/(app)/psicologo/*` e `app/(app)/paciente/*`, `stores/wizard-store.ts`.

**Modificar:** `lib/api/client.ts` (interceptor 401/erro) e `lib/constants.ts` (nav por perfil)
da Fase 0.

**Pré-requisitos de backend a pleitear (PRD §10):** refresh token, `GET /me`, score por escala +
risco, endpoints escopados ao paciente, login 500→401, OpenAPI, CORS restrito.

**Entrega:** login real, núcleo clínico do psicólogo (CRUD pacientes + avaliações + resultado),
paciente respondendo fim-a-fim, base de analytics preparada.
