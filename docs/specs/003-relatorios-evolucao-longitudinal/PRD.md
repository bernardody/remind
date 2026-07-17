# PRD: Relatórios — Evolução Longitudinal do Paciente

- **Spec ID**: 003-relatorios-evolucao-longitudinal
- **Data**: 2026-07-16
- **Status**: Planejamento consolidado com o usuário via chat (não spec-kit formal);
  **implementado nesta mesma sessão** (backend + frontend + testes) — ver §9 (Status de
  Implementação). Verificação: 47/47 testes backend (`mvnw test`) e
  typecheck/lint/build do frontend limpos. **Faltando**: verificação end-to-end manual num
  navegador contra backend+Postgres reais (skill `verify`) — não executada nesta sessão.
- **Escopo**: Backend (`api/`) + Frontend (`remind-web/`)
- **Baseado em**: auditoria do código-fonte atual (backend Spring Boot, frontend Next.js, schema
  SQL), leitura de `docs/specs/architecture.md`, `docs/specs/ontology.md`,
  `docs/specs/002-convite-questionario/`, `.claude/specs/04-spec-aplicacao.md` §6 (Fase 5b) e do
  `PRD.md` raiz (redesign UI/UX, achado #8 e §5.10/§5.12). Retoma explicitamente a Fase 5b,
  adiada em 2026-07-11/12.

---

## 1. Objetivo

Dar ao psicólogo uma tela de relatórios que mostre a **evolução de um paciente ao longo do
tempo** num questionário — não só o resultado mais recente (isso já existe em
`avaliacoes/[id]/pacientes/[pid]`), mas a série histórica completa: todas as aplicações
anteriores, comparadas entre si, com gráficos por escala e indicador de melhora/piora/estabilidade.

Hoje isso é impossível por dois motivos, ambos deliberados e documentados (não bugs):

1. Um paciente só pode responder um `Questionnaire` **uma única vez** — reforçado por `409` em
   dois pontos (`AnswerQuestionnaireService`, `CreateInviteService` / INV-004), consequência de um
   incidente real já corrigido (R10, `.claude/specs/04-spec-aplicacao.md` §7): responder duas
   vezes quebrava `findByPatientAndQuestionnaire` (`Optional`) e derrubava `/resultado` com 500.
2. A Fase 5b (evolução longitudinal) foi **adiada deliberadamente** em 2026-07-11 — não por falta
   de solução, mas por decisão de produto de não mexer nesse invariante ainda.

Este documento retoma a Fase 5b e formaliza a solução acordada com o usuário nesta sessão.

---

## 2. Contexto — como a aplicação funciona hoje (investigado no código real)

### 2.1 Armazenamento de resposta — já é "por evento", não "por paciente"

Cada resposta gera uma cadeia independente e imutável, sem nenhuma constraint de unicidade no
banco bloqueando múltiplas ocorrências para o mesmo par paciente/questionário:

```
QuestionnaireAnswer      (1 por rodada — patient, questionnaire, answered_at)
  → QuestionnaireResult      (1:1, average = média das médias por escala)
      → QuestionnaireScaleResult  (N por rodada, 1 por escala — average + risk_label)
  → PatientQuestionResponse  (N por rodada — respostas brutas por pergunta)
```

`schema.sql` confirmado: nenhuma tabela acima tem `UNIQUE(id_patient, id_questionnaire)`. O
bloqueio de resposta única é **só de aplicação**, em dois pontos:

- `AnswerQuestionnaireService.java:51` — `409` se `findByPatientAndQuestionnaire(...).isPresent()`.
- `CreateInviteService.java:69-71` (INV-004) — mesmo `409` ao tentar criar um novo convite.

### 2.2 Convite hoje não é obrigatório para responder

`AnswerQuestionnaireService` **não exige** convite — só o vincula *se* existir um
(`questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(...).ifPresent(...)`,
linha 71). Quem restringe de fato é o `InviteScopedAuthorizationFilter`, e só quando o paciente
chega via o **JWT de escopo restrito** emitido ao consumir o token do convite
(`AccessTokenService.generateInviteScoped`, claim `scope=invite`). Um paciente com sessão normal
(login por senha) pode responder **qualquer** questionário ativo direto pela tela "Início"
(`available-questionnaires.tsx`), sem nunca ter recebido convite — confirmado no próprio comentário
do componente: *"backend não escopa 'atribuídas a este paciente'"* (gap já catalogado em
`PRD.md` raiz §5.12 e no PRD 002 §2.3).

### 2.3 Convite já tem toda a máquina de estados necessária

`QuestionnaireInvite.status` (`InviteStatus`: `PENDING, SENT, OPENED, ANSWERED, EXPIRED, REVOKED`)
mais o índice único parcial `(id_patient, id_questionnaire) WHERE active=true` garantem **um
único registro de convite vivo por par paciente/questionário**. Reenviar (`CreateInviteService`,
INV-002) **reutiliza o mesmo registro**, girando o token e resetando `status→PENDING`,
`opened_at`/`consumed_at→null`. Ou seja: **"enviar de novo" já existe hoje como endpoint**
(`POST /pacientes/{id}/questionarios/{qid}/convites`) — não precisa de nada novo para isso.

### 2.4 Decisão já registrada antes desta sessão (Fase 5b)

`.claude/specs/04-spec-aplicacao.md` §6 já documentava, em 2026-07-11: não relaxar o `409`;
reaplicação seria via `Questionnaire` novo por rodada, agregando por `Scale` entre vários
`Questionnaire`s. **Esta sessão substitui esse caminho** por um mais simples (§3), decidido com o
usuário: reaproveitar o **mesmo** `Questionnaire`, sem clonar nada — porque o verdadeiro problema
não era o modelo de dados (que já suporta múltiplas respostas fisicamente), e sim o convite não
ser obrigatório. Resolvendo isso, a resposta múltipla ao mesmo `Questionnaire` deixa de ser o
risco que motivou o adiamento original: ela passa a ser **controlada pelo psicólogo**, não
autosserviço do paciente.

---

## 3. Decisão de arquitetura

> **O psicólogo reaplica reenviando o convite do mesmo `Questionnaire`. Não existe clonagem de
> questionário nem conceito novo de "série"/"programa de aplicação".**

Regra única, válida tanto para a 1ª resposta quanto para qualquer reaplicação:

> Um paciente só pode responder (`POST /questionarios/{id}/responder`) se existir, para aquele
> par paciente/questionário, um `QuestionnaireInvite` **vivo**: `active=true`,
> `status ∉ {ANSWERED, EXPIRED, REVOKED}`, `expires_at > now()`.

Consequências diretas:

- O convite passa a ser **obrigatório mesmo na primeira resposta** — fecha, como efeito colateral
  necessário (não opcional), o gap de §2.2/§5.12 do PRD raiz.
- O paciente **não precisa "aceitar" o convite** para o questionário aparecer para ele — a mera
  existência do convite (`PENDING`/`SENT`, antes mesmo de o link ser clicado) já é suficiente para
  a tela "Início" listá-lo. O consumo do token (`ConsumeInviteService`, INV-008) continua existindo
  como via de acesso *sem login prévio* (e-mail/WhatsApp), mas deixa de ser a única forma de
  chegar ao wizard — a sessão normal do paciente também vale, desde que o convite exista.
- Reaplicar = reenviar o convite (endpoint já existente). **Nenhum endpoint novo de "criar
  questionário" é necessário** — ao contrário do caminho descartado em §2.4.
- Os dois `409` de §2.1 são **removidos por completo**, não ajustados — a regra do convite os
  substitui integralmente.
- **Nenhuma mudança de schema.** Toda a cadeia de armazenamento de §2.1 já suporta o histórico
  como está.

---

## 4. Backend

### 4.1 `AnswerQuestionnaireService` — gate de convite obrigatório

- Remove o bloqueio antigo (`já respondeu este questionário`).
- Busca o convite vivo do par paciente/questionário; se não houver, `404`/`403`
  ("Você precisa de um convite ativo do seu psicólogo para responder este questionário").
- Consome o convite **atomicamente** antes de gravar a resposta — novo método
  `@Modifying` em `QuestionnaireInviteRepository` (mesmo padrão de `consumeByTokenHash`, já usado
  para INV-008): `UPDATE ... SET status = ANSWERED WHERE id_patient=? AND id_questionnaire=? AND
  active=true AND status NOT IN (ANSWERED,EXPIRED,REVOKED) AND expires_at > CURRENT_TIMESTAMP`.
  Se 0 linhas afetadas → outra requisição já consumiu (corrida) → `409`. Evita reintroduzir o R10
  por uma via nova (dois submits simultâneos do mesmo convite).
- Depois de gravar `QuestionnaireAnswer` + calcular resultado, associa `invite.questionnaireAnswer`
  ao registro novo (sobrescreve o vínculo da rodada anterior — aceitável, o histórico de
  respostas/resultados vive em `questionnaire_answers`, não no convite; ver §7 Riscos).

### 4.2 `CreateInviteService` — remove INV-004

Remove o `409` "Paciente já respondeu este questionário". Reenviar para quem já respondeu passa a
ser o fluxo normal de reaplicação.

### 4.3 Histórico — repositórios e serviços de leitura

| Componente | Mudança |
|---|---|
| `QuestionnaireAnswerRepository` | Novo `@Query` explícito (JPQL — `answered_at` é snake_case, mesmo cuidado já documentado para `token_hash` em `QuestionnaireInviteRepository`) retornando todas as respostas do par paciente/questionário, ordenadas por `answered_at` desc. |
| `GetPatientQuestionnaireResultService` / `GetMyQuestionnaireResultService` | Passam a pegar a **primeira** da lista acima (mais recente) em vez do `Optional` singular. Contrato de resposta não muda — continuam sendo "o resultado atual". |
| `GetPatientQuestionnaireAnswersService` | Ganha parâmetro opcional `answerId` (query string); se ausente, usa a mais recente (mesmo comportamento atual). Permite abrir as respostas brutas de uma rodada específica a partir da linha do tempo do relatório. |
| `QuestionnaireResultRepository` / `QuestionnaireScaleResultRepository` | Novos métodos em lote (`findByQuestionnaireResponseIn` / `findByQuestionnaireResultIn`) para o endpoint de evolução não fazer N+1 (1 query por rodada). |

### 4.4 Endpoint novo — evolução

`GET /questionarios/{id}/pacientes/{patientId}/evolucao` (psicólogo, mesma autorização de
`GetPatientQuestionnaireResultService`: paciente precisa pertencer ao psicólogo autenticado).

Resposta: lista ordenada de "aplicações" (mesmo formato por item que
`GetPatientQuestionnaireResultResponse` já usa hoje — `questionnaireAnswerId`, `answeredAt`,
`average`, `scaleResults[]`), mais um rótulo de tendência por escala (`MELHORA` / `PIORA` /
`ESTAVEL` / `null` na 1ª rodada, sem anterior para comparar).

**Cálculo de tendência** (no serviço, não no frontend — regra de negócio fica em `service/`):
compara a rodada N com a N−1 por escala, usando a **posição da faixa de risco** (`scale_risk_bands`
ordenadas por `min_value`, mesma fonte que `QuestionnaireResultCalculator.classify` já usa) como
critério primário — mudou de faixa = sinal mais confiável que delta numérico bruto, dado o viés de
resposta Likert já documentado em adolescentes (`PRD.md` raiz §3.6). Empate de faixa cai para
delta numérico com epsilon (±0.2) para não marcar "piora"/"melhora" por ruído de resposta.

### 4.5 Endpoint novo — convites do próprio paciente (self-service)

`GET /questionarios/convites` (paciente, via JWT, sem `patientId` — mesmo padrão de
`/questionarios/respondidos`), reaproveitando `QuestionnaireInviteRepository.findByPatientAndActiveTrue`
(já existe). Base de dados da tela "Início" nova (§5.1) — substitui a listagem por catálogo global.

---

## 5. Frontend

### 5.1 Início do paciente (`available-questionnaires.tsx`)

Troca a fonte de dados: em vez de `/questionarios` (catálogo global) + `/questionarios/respondidos`
para saber o que já foi respondido, passa a consumir só `/questionarios/convites` — cada convite já
carrega status (`PENDING/SENT/OPENED` → "Responder"; `ANSWERED` → "Já respondido";
`EXPIRED`/`REVOKED` → oculto ou "Indisponível"). Resolve, como consequência necessária de §3, o gap
"lista tudo, não só o atribuído" (`PRD.md` raiz §5.12).

### 5.2 Tela de relatórios (`psicologo/relatorios/page.tsx`)

Sai do placeholder `EmptyState`. Estrutura:

1. **Seletor de paciente** (reaproveita busca já usada em `patients-view.tsx`).
2. **Linha do tempo de aplicações** — lista simples de datas/labels, não é gráfico; mostra tempo
   entre aplicações como texto.
3. **Evolução por escala** — `LineChart` (Recharts, já é dependência do projeto), um por escala,
   eixo X = `answeredAt` real (espaçamento não uniforme comunica os intervalos), eixo Y = 0–5, com
   faixas de fundo nas cores de `RISK_BANDS` (`lib/constants.ts`) já usadas em `Gauge`/`DomainBars`.
   Linha é a escolha certa aqui porque a pergunta clínica é direção/velocidade de mudança ao longo
   do tempo — nenhum outro tipo de gráfico comunica isso.
4. **Múltiplas escalas comparadas** — small multiples (grade de `LineChart`s sincronizados no eixo
   X), não um único gráfico com 5 séries sobrepostas — paleta de marca é restrita e sobrepor vira
   ilegível.
5. **Snapshot da rodada mais recente** — reaproveita `DomainBars` (Fase 5a) sem mudança.
6. **Comparação entre duas rodadas específicas** — `BarChart` agrupado (evolução de `DomainBars`
   para 2 séries lado a lado), não radar — radar tem problemas conhecidos de leitura precisa e
   contraria o rigor de acessibilidade já aplicado no produto (WCAG, "nunca só cor").
7. **Indicador de tendência** — badge por escala (▲/▼/–, nunca só cor), usando o campo de tendência
   já calculado pelo backend (§4.4).

Novo componente: `components/charts/trend-line.tsx` — nome já previsto em
`.claude/specs/04-spec-aplicacao.md` §6.

### 5.3 Navegação

`avaliacoes/[id]/pacientes/[pid]/page.tsx` ganha link "Ver evolução" quando o paciente tiver mais
de 1 aplicação registrada.

---

## 6. Fora de escopo (explicitamente)

- CRUD de `Questionnaire`/`Question`/`Scale`/`QuestionOption` para o psicólogo — não é necessário
  com o modelo de §3 (reaproveita o mesmo questionário, não cria um novo).
- Qualquer relaxamento adicional da regra "uma resposta por convite vivo".
- Escopo real de "quem pode ver quem" além do que já existe (`Patient.psychologist`).
- Exportação/impressão do relatório (já registrada como pré-requisito futuro em `PRD.md` raiz
  §5.9).

---

## 7. Riscos

| # | Risco | Mitigação / observação |
|---|---|---|
| 1 | Reintroduzir uma variante do R10 (corrida de duplo-submit) ao permitir múltiplas respostas | Consumo atômico do convite antes de gravar a resposta (§4.1), mesmo padrão de `consumeByTokenHash`. |
| 2 | `QuestionnaireInvite.questionnaireAnswer` só guarda a rodada mais recente (FK sobrescrita a cada reaplicação) | Aceitável — o histórico de respostas/resultados não depende do convite, vive em `questionnaire_answers`/`questionnaire_results`. Perde-se só "qual convite especificamente gerou a rodada 1", não a rodada em si. |
| 3 | Convite obrigatório na 1ª resposta muda comportamento hoje em produção (paciente podia responder sem convite) | Mudança deliberada e intencional desta spec — decisão do usuário nesta sessão, não efeito colateral acidental. |
| 4 | Viés de resposta Likert gerando falso "piora/melhora" | Critério primário de tendência é cruzamento de faixa de risco, não delta bruto (§4.4). |
| 5 | Tela "Início" e relatório dependem do mesmo `QuestionnaireInvite` como fonte de verdade | Já é a fonte de verdade de convite hoje (INV-002/008/009) — sem tabela nova, sem duplicação de estado. |

---

## 8. Rastreabilidade com a conversa que originou esta spec

Esta spec formaliza uma decisão tomada interativamente com o usuário (psicólogo/produto), não uma
sessão de `spec-kit` completa (sem `tasks/`, `contracts/`, `decision-log.md` separados — nível de
formalidade equivalente ao `PRD.md` único de `docs/specs/002-convite-questionario/`). Pontos
decididos explicitamente pelo usuário:

1. Não relaxar a resposta única "livre" — controle de reaplicação fica com o psicólogo, via
   reenvio de convite, não autosserviço do paciente.
2. Reaproveitar o mesmo `Questionnaire` em vez de clonar um novo por rodada (mais simples, descarta
   o caminho de `.claude/specs/04-spec-aplicacao.md` §6).
3. Paciente não precisa "aceitar" o convite — a existência do convite já é suficiente para o
   questionário aparecer na tela dele.
4. Relatório precisa mostrar a evolução completa (não só a última resposta, que já é visível em
   outro lugar), comparando rodadas antigas com a atual, com gráficos.

---

## 9. Status de Implementação

_Atualizado durante a implementação nesta mesma sessão — ver commits/diff para o estado real do
código a qualquer momento após esta data._

| Item | Status |
|---|---|
| Este documento | ✅ |
| Backend — gate de convite obrigatório (§4.1) | ✅ `AnswerQuestionnaireService` + `QuestionnaireInviteRepository#markAnsweredIfLive` |
| Backend — remoção INV-004 (§4.2) | ✅ `CreateInviteService` |
| Backend — histórico/latest (§4.3) | ✅ `QuestionnaireAnswerRepository#findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc` + `GetPatientQuestionnaireResultService`/`GetMyQuestionnaireResultService`/`GetPatientQuestionnaireAnswersService` (parâmetro `answerId`) |
| Backend — endpoint de evolução (§4.4) | ✅ `GetPatientQuestionnaireEvolutionService` + `GET /questionarios/{id}/pacientes/{patientId}/evolucao` |
| Backend — self-service de convites (§4.5) | ✅ `ListMyInvitesService` + `GET /questionarios/convites` |
| Backend — testes | ✅ 6 testes novos (`AnswerQuestionnaireServiceTest`, `CreateInviteServiceTest`, `GetPatientQuestionnaireEvolutionServiceTest`) — suíte completa 47/47 verde |
| Frontend — Início via convites (§5.1) | ✅ `available-questionnaires.tsx` + `useMyInvites`; wizard (`responder/page.tsx`) também migrado da checagem por `/resultado` pra checagem por convite vivo |
| Frontend — tela de relatórios (§5.2) | ✅ `ReportsView` + `TrendLine` + `ScaleComparisonBars` + `TrendBadge`; badge "Em breve" removido da sidebar |
| Frontend — navegação (§5.3) | ✅ Link "Ver evolução" em `avaliacoes/[id]/pacientes/[pid]` (só quando há >1 aplicação) |
| Verificação estática | ✅ `mvnw test` (47/47), `npm run typecheck`, `npm run lint`, `npm run build` — todos limpos |
| Verificação end-to-end (navegador real) | ⏳ Não executada nesta sessão — recomendado antes de deploy (skill `verify`) |
