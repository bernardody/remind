# PRD: Convite para Paciente Responder Questionário

- **Spec ID**: 002-convite-questionario
- **Data**: 2026-07-12
- **Status**: Em implementação parcial — **Fase C (e-mail) concluída e validada em
  produção externa (Zoho)**; Fases A, B e D ainda não iniciadas. Ver §22 (Status de
  Implementação) para o detalhe completo do que já existe em código vs. o que ainda é só
  planejamento.
- **Escopo**: Backend (`api/`) + Frontend (`remind-web/`)
- **Baseado em**: auditoria completa do código-fonte atual (backend Spring Boot, frontend
  Next.js, schema SQL), leitura de `docs/specs/architecture.md`, `docs/specs/ontology.md`,
  `docs/specs/001-login-google-psicologo/`, `.claude/specs/04-spec-aplicacao.md` e do
  `PRD.md` raiz (redesign UI/UX), e pesquisa externa sobre magic links, tokens de convite e
  padrões de intake de software clínico (SimplePractice/TherapyNotes). Ver §21.

> **Atualização (2026-07-12)**: este documento nasceu como planejamento puro ("nenhuma
> implementação foi feita"), mas a decisão de provedor de e-mail (§17) já foi tomada e a
> Fase C (§18) já foi **implementada e testada de ponta a ponta** antes das demais fases —
> ver §22 para o resumo do que rodou em código real. As seções 1–21 permanecem como o
> planejamento original (atualizado in-line onde a implementação mudou alguma premissa);
> §22 é o registro factual do que foi efetivamente construído.

---

## 1. Objetivo

Permitir que o psicólogo **convide um paciente específico a responder um questionário
específico**, por e-mail (com fallback de link copiável), sem depender do paciente já
conhecer sua senha de acesso — e sem que o paciente veja questionários que não foram
destinados a ele.

Hoje isso não é possível: não existe noção de "este questionário é para este paciente"
(todo questionário ativo é visível a todos os pacientes do psicólogo), não existe envio de
e-mail em lugar nenhum do sistema, e a senha do paciente é definida manualmente pelo
psicólogo no cadastro — sem nenhum mecanismo de ativação de conta ou link de acesso.

---

## 2. Contexto — como a aplicação funciona hoje

Levantado lendo o código-fonte real (`api/` e `remind-web/`), não por suposição.

### 2.1 Modelo de domínio atual

- `User` (`api/.../domain/User.java`) — base de identidade, `type` = `PSYCHOLOGIST` ou
  `PATIENT`, `password` nullable (só para contas Google), `profileComplete`.
- `Patient` (`domain/Patient.java`) — `User` + `Psychologist` dono + `birthDate`/`gender`.
- `Questionnaire` (`domain/Questionnaire.java`) — catálogo **global**, só `title` +
  timestamps. Sem qualquer referência a paciente ou psicólogo.
- `QuestionnaireAnswer` (`domain/QuestionnaireAnswer.java`) — a "tentativa de resposta":
  `Patient` + `Questionnaire` + `answeredAt`. É criada **somente quando o paciente
  responde**, nunca antes.
- Não existe nenhuma entidade `Invite`, `Token`, `Assignment` ou equivalente.

### 2.2 Criação de paciente hoje

`POST /pacientes` → `InsertPatientService` (`service/patient/InsertPatientService.java`).
O psicólogo preenche `name, email, cpf, phone, password, birthDate, gender` no formulário
(`patient-form-dialog.tsx`) — **o próprio psicólogo digita a senha do paciente**, que
presumivelmente repassa por fora do sistema (WhatsApp, verbalmente). Não há:
- e-mail de boas-vindas;
- fluxo de "definir senha no primeiro acesso";
- fluxo de "esqueci minha senha" (confirmado ausente também em `PRD.md:652-658` do
  redesign de UI/UX).

### 2.3 Questionário hoje: catálogo global, sem atribuição

- Não há CRUD de `Questionnaire`/`Question`/`Scale` — populados só via
  `api/data/insert.sql` (confirmado no código: `QuestionnaireController` só expõe `GET` +
  `POST /{id}/responder`; comentário em `questionnaires-view.tsx:31`: *"Backend não expõe
  criar/editar/remover questionário para o psicólogo — só leitura"*).
- `ListQuestionnaireService.list()` retorna **todos os questionários ativos**,
  indiscriminadamente, para qualquer paciente autenticado (`findAllByActiveTrue`, sem
  filtro por paciente). Já documentado como simplificação consciente em
  `.claude/specs/04-spec-aplicacao.md:282`: *"o backend não escopa 'atribuídas a este
  paciente' — lista todas as ativas, sem fingir um status 'pendente' que não há dado pra
  sustentar."*
- O paciente entra em `/paciente/inicio` (`AvailableQuestionnaires`), vê todos os
  questionários ativos, clica "Responder", é levado ao wizard
  (`app/(app)/paciente/questionarios/[id]/responder/page.tsx`), que **exige
  `requireRole("PATIENT")`** — login prévio, sempre.
- Bloqueio de reenvio: dupla camada. SSR checa `GET /questionarios/{id}/resultado` (200 ⇒
  `EmptyState` "já respondido"); e o backend garante com 409 em
  `AnswerQuestionnaireService.java:49-51`:
  ```java
  if (questionnaireAnswerRepository.findByPatientAndQuestionnaire(patient, questionnaire).isPresent()) {
      throw new ResponseStatusException(HttpStatusCode.valueOf(409), "Você já respondeu este questionário");
  }
  ```
  Essa regra é garantida só em nível de aplicação — não há `UNIQUE(id_patient,
  id_questionnaire)` no schema. **A Fase 5b (evolução longitudinal, adiada) já decidiu
  não relaxar esse 409** — reaplicação futura será via `Questionnaire` novo por escala,
  não por resposta múltipla ao mesmo `Questionnaire`. Este PRD deve preservar essa
  decisão.

### 2.4 Autenticação hoje

- Login por senha (`POST /login`) e por Google (`POST /login/google`, só psicólogo). JWT
  RS256 próprio, `issuer=tcc`, **expiração de 600s (10 min), sem refresh token**
  (`AccessTokenService.java`). Mesmo formato de token para psicólogo e paciente — a
  distinção é só o claim `email`, resolvido a cada request buscando `Psychologist` ou
  `Patient` pelo `User` associado (não há roles/`@PreAuthorize` reais apesar de
  `@EnableMethodSecurity` habilitado).
- Existe um precedente arquitetural direto para "token com escopo restrito": o filtro
  `IncompleteProfileAuthorizationFilter` (`config/`), que bloqueia (403) todo endpoint
  exceto `GET/PUT /psychologists/me/profile` enquanto `profileComplete=false`. **Este é o
  padrão a reutilizar** para o token de convite (ver §16).
- **Não existe nenhum mecanismo de token de uso único, magic link ou reset de senha** em
  nenhuma camada — nem no backend (sem `spring-boot-starter-mail`, sem tabela de token),
  nem no frontend (`nodemailer` só aparece como dependência transitiva não usada do
  NextAuth; nenhum Email/Magic Link provider configurado em `lib/auth/config.ts`).

### 2.5 Frontend — peças reaproveitáveis

- **BFF proxy** (`app/api/[...proxy]/route.ts`) repassa qualquer rota nova sob `/api/*`
  automaticamente — endpoints novos de convite não exigem alteração no proxy.
- Padrão de feature: `features/<nome>/{schemas.ts (Zod), api.ts (TanStack Query hooks),
  components/}`, igual `features/patients/` e `features/questionnaires/`.
- Componentes prontos para reuso: `Alert`/`ErrorState` (estado bloqueante — regra do
  design system: *"nunca usar Toast para erro que bloqueia o fluxo clínico"*), `Badge`
  (status), `Dialog` (modal de convite), `sonner`/toast (feedback pontual "Link
  copiado!"), `EmptyState`. **Não existe** componente de "copiar link" nem QR code — a
  construir.

### 2.6 Conclusão da análise: greenfield quase total

Nenhuma peça de infraestrutura necessária para "convite" existe hoje em nenhuma camada:
sem mailer, sem tabela de token, sem tabela de atribuição paciente↔questionário, sem
fluxo de ativação de conta. O redesign de UI/UX (`PRD.md` raiz) também não cogitou esse
fluxo — parte do pressuposto de que o paciente já tem conta e senha. As únicas peças
reaproveitáveis são: infraestrutura JWT (`JwtEncoder`/`JwtDecoder`, chaves RSA já
configuradas), o padrão de filtro de autorização com escopo restrito
(`IncompleteProfileAuthorizationFilter`), o BFF proxy, o design system, e a regra de
bloqueio de reenvio (409) já testada em produção.

---

## 3. Problema

1. **Sem atribuição**: não há como dizer "este questionário é para este paciente" — hoje
   é tudo ou nada (todo questionário ativo, para todo paciente do psicólogo).
2. **Sem canal de notificação**: o paciente só sabe que precisa responder algo se o
   psicólogo avisar por fora do sistema (telefone, WhatsApp).
3. **Fricção de primeiro acesso**: o paciente depende de o psicólogo lhe passar uma senha
   definida por terceiro — sem e-mail de boas-vindas, sem "criar minha própria senha",
   sem recuperação de senha.
4. **Nenhuma infraestrutura de convite/token/e-mail existe** para apoiar qualquer um dos
   pontos acima — é preciso construir do zero, com implicações de segurança (token
   vazado, reenvio, expiração) que precisam ser explicitamente decididas.

---

## 4. Solução proposta (visão geral)

Introduzir o conceito de **Convite de Questionário** (`QuestionnaireInvite`): a entidade
que ao mesmo tempo (a) **atribui** um `Questionnaire` a um `Patient` específico e (b)
carrega um **token de uso único, com expiração**, que autentica o paciente com um
**JWT de escopo restrito** — suficiente para abrir e responder *apenas aquele
questionário* (e, opcionalmente, definir sua senha), sem precisar de login completo
prévio.

Isso resolve os 3 problemas de uma vez: a atribuição fica registrada (mata a lacuna do
"todo mundo vê tudo"), o convite é o canal de notificação (e-mail com link), e o link
serve como ativação de conta na primeira vez.

**Decisão de escopo deliberada** (para não fazer "big bang", seguindo a diretriz já
aplicada no redesign de UI/UX de "migração incremental sem quebrar o que já roda"):

- O login por senha **continua existindo** e não é removido. O convite é um **caminho
  alternativo de acesso** para o caso de uso "responder este questionário", não uma
  substituição do sistema de login.
- `password` deixa de ser **obrigatório** na criação do paciente (o psicólogo pode
  cadastrar sem definir senha ainda, e o paciente a define ao aceitar o primeiro
  convite) — mas continua **permitido** informá-la, para não quebrar o fluxo atual para
  quem já usa assim.
- A tela `/paciente/inicio` (lista global de questionários ativos) **não é alterada
  neste PRD** — continua existindo como está. O convite é aditivo: cria um caminho novo
  (link direto) além do existente. Migrar `/paciente/inicio` para mostrar só
  questionários atribuídos é discutido como possível Fase 2 em §18, não neste escopo.
- O 409 de bloqueio de reenvio (`AnswerQuestionnaireService.java:49-51`) **não é
  relaxado** — consistente com a decisão já tomada para a Fase 5b.

---

## 5. Modelo de dados

### 5.1 Nova entidade: `QuestionnaireInvite`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `Long` (PK, identity) | Padrão do projeto |
| `patient_id` | FK → `patients` | Para quem é o convite |
| `questionnaire_id` | FK → `questionnaires` | Qual questionário |
| `psychologist_id` | FK → `psychologists` | Quem convidou (auditoria; deve bater com o dono do paciente) |
| `token_hash` | `VARCHAR(255)`, indexado, não-nulo | **SHA-256 do token**, nunca o token em claro (ver §16) |
| `status` | `VARCHAR` / enum | `PENDING` → `SENT` → `OPENED` → `ANSWERED` \| `EXPIRED` \| `REVOKED` (ver §13) |
| `expires_at` | `TIMESTAMP`, não-nulo | Ver §14 para a política de prazo |
| `sent_at` | `TIMESTAMP`, nulo | Quando o e-mail foi efetivamente enviado |
| `opened_at` | `TIMESTAMP`, nulo | Quando o link foi clicado pela 1ª vez |
| `consumed_at` | `TIMESTAMP`, nulo | Quando o token foi trocado por acesso (uso único) |
| `questionnaire_answer_id` | FK → `questionnaire_answers`, nulo | Preenchido quando o paciente efetivamente responde |
| `created_at` / `updated_at` / `active` | — | Padrão já usado em todas as entidades do projeto |

Constraints:
- `UNIQUE(patient_id, questionnaire_id) WHERE active = true` — no máximo 1 convite ativo
  por par paciente/questionário (reenvio **atualiza** o convite existente, não cria um
  segundo — ver §14).
- `UNIQUE(token_hash)`.

> Nota de consistência com o schema atual: hoje `questionnaire_answers` também não tem
> `UNIQUE(id_patient, id_questionnaire)` a nível de banco (só a nível de aplicação). Este
> PRD **não** propõe adicionar essa constraint retroativamente (fora de escopo — risco de
> regressão em dado de produção existente), mas recomenda adicioná-la para
> `questionnaire_invites` desde o início, já que é uma tabela nova sem dado legado.

### 5.2 Alteração em `Patient`/`InsertPatientRequest`

- Backend: `password` em `InsertPatientRequest` passa de obrigatório para **opcional**
  (Bean Validation `@NotBlank` removido; serviço gera `User` sem senha, análogo ao que já
  acontece hoje para contas Google — reaproveita o `password` nullable já existente em
  `User`).
- Frontend: campo "Senha" em `CreatePatientForm`/`InsertPatientRequestSchema` passa a ser
  opcional, com texto explicando "deixe em branco para o paciente definir a própria senha
  ao aceitar um convite".

### 5.3 Alteração em `schema.sql`

Nova tabela `questionnaire_invites` espelhando 5.1, seguindo exatamente o estilo já usado
(FKs `id_patient`, `id_questionnaire`, etc., `created_at`/`updated_at` `DATE`, `active`
`BOOLEAN`). Sem Flyway/Liquibase configurado no projeto — migração continua manual (ver
nota de risco em §17 sobre isso, já documentado em memória de deploy anterior).

---

## 6. Fluxo completo da funcionalidade

1. **Psicólogo convida**: na tela do paciente (ou na tela do questionário), o psicólogo
   escolhe "Convidar para responder" → seleciona o `Questionnaire` (ou já está no
   contexto de um) → confirma.
2. **Backend cria o convite**: gera `QuestionnaireInvite` (`status=PENDING`), gera token
   aleatório (não persistido em claro), grava só o hash, define `expires_at`.
3. **Envio**: backend dispara e-mail para o paciente (endereço já cadastrado em `User`)
   com o link (`https://app.remindapp.com.br/convite/{token}`); `status=SENT`,
   `sent_at=now()`. Fallback: tela do psicólogo também mostra um botão "copiar link" (para
   os casos em que o e-mail falhar ou o paciente não tiver e-mail confiável — comum em
   contexto de adolescentes).
4. **Paciente abre o link**: página nova `remind-web` (`/convite/[token]`) chama o backend
   para validar o token. Se válido: `status=OPENED` (se ainda não estava), backend emite
   um **JWT de escopo restrito** (ver §16) e o frontend estabelece uma sessão restrita
   (NextAuth) redirecionando direto ao wizard daquele questionário — **pulando a tela de
   login**.
5. **(Opcional, se o paciente ainda não tem senha)**: antes ou depois de responder, tela
   simples "criar sua senha de acesso" (para acessos futuros via login normal). Não
   bloqueia a resposta ao questionário — pode ser feito depois.
6. **Paciente responde**: reaproveita 100% o wizard existente
   (`questionnaire-wizard.tsx`, `wizard-store.ts`, `POST /questionarios/{id}/responder`).
   Nenhuma mudança nessa parte.
7. **Consumo do convite**: ao concluir a resposta com sucesso, backend marca
   `status=ANSWERED`, `consumed_at=now()`, `questionnaire_answer_id` preenchido. O token
   já havia sido invalidado para reuso desde a primeira troca por sessão (passo 4) — ver
   §16 sobre uso único vs. sessão de curta duração para completar o wizard de várias
   telas.
8. **Psicólogo acompanha**: tela do paciente/questionário passa a mostrar o status do
   convite (`Badge`: "Convite enviado", "Aberto, aguardando resposta", "Respondido",
   "Expirado") e permite reenviar ou revogar.

---

## 7. Fluxo dos convites — máquina de estados

```
PENDING → SENT → OPENED → ANSWERED
            │        │
            ▼        ▼
         EXPIRED   EXPIRED   (se expires_at passa antes de qualquer ação)
            │        │
            ▼        ▼
         REVOKED   REVOKED   (psicólogo cancela manualmente, a qualquer momento antes de ANSWERED)
```

Regras (EARS):

| ID | Requisito |
|----|-----------|
| INV-001 | O sistema SHALL permitir que um psicólogo crie um convite associando um `Patient` seu a um `Questionnaire` ativo. |
| INV-002 | IF já existe um convite ativo (`status` não-terminal) para o mesmo par paciente/questionário THEN o sistema SHALL reutilizá-lo (reenvio, ver INV-006) em vez de criar um segundo registro. |
| INV-003 | WHEN um convite é criado THEN o sistema SHALL gerar um token de uso único, armazenar apenas seu hash, e enviar o link por e-mail ao endereço cadastrado do paciente. |
| INV-004 | IF o paciente já respondeu esse questionário (existe `QuestionnaireAnswer`) THEN o sistema SHALL rejeitar a criação do convite (mesma regra de negócio do 409 em `AnswerQuestionnaireService`). |
| INV-005 | WHEN o token expira (`expires_at` no passado) THEN o sistema SHALL rejeitar seu uso e o convite SHALL transicionar para `EXPIRED` na próxima consulta/tentativa de uso. |
| INV-006 | O sistema SHALL permitir reenviar um convite não respondido, o que SHALL invalidar o token anterior e emitir um novo com novo prazo de expiração (rotação, não acúmulo). |
| INV-007 | O sistema SHALL permitir que o psicólogo revogue (`REVOKED`) um convite ainda não respondido a qualquer momento. |
| INV-008 | WHEN um token válido é trocado por acesso pela primeira vez THEN o sistema SHALL invalidá-lo para reuso como *link*, emitindo em seu lugar uma sessão de curta duração restrita ao fluxo de resposta (ver §16). |
| INV-009 | WHEN o paciente conclui a resposta ao questionário associado THEN o sistema SHALL marcar o convite como `ANSWERED` e vincular a `QuestionnaireAnswer` gerada. |
| INV-010 | IF um convite está `EXPIRED`, `REVOKED` ou `ANSWERED` THEN o sistema SHALL rejeitar qualquer tentativa de uso do token, com mensagem apropriada ao estado (ver §15). |

---

## 8. Fluxo de expiração e reenvio

- **Prazo de expiração recomendado: 7 dias corridos** (configurável via
  `application.yaml`), não 15 minutos. Justificativa (diverge deliberadamente da
  recomendação OWASP de tokens de login curtos — ver §21): um magic link de *login* é
  clicado segundos depois de ser solicitado pelo próprio usuário; um *convite* de
  questionário clínico é assíncrono — o paciente (frequentemente adolescente, conforme
  público do produto) pode levar dias para checar o e-mail. Produtos de referência
  pesquisados (SimplePractice) usam prazos de dias, não minutos, para o mesmo tipo de
  convite assíncrono. Curto demais geraria alta taxa de reenvio por fricção, não por
  segurança.
- **Reenvio não empilha convites**: reenviar **atualiza** o mesmo registro
  (`QuestionnaireInvite`), gera novo token (invalida o antigo — rotação, igual boa
  prática de refresh token), reseta `expires_at`, mantém o histórico de
  `sent_at`/`opened_at` anterior sobrescrito ou movido a um log simples (decisão de
  detalhe, não crítica).
- **Expiração é verificada de forma preguiçosa** (lazy) — não precisa de job agendado:
  ao tentar consumir um token, o backend checa `expires_at` e responde 410/404
  apropriado; o `status` é atualizado para `EXPIRED` nessa checagem (ou por uma consulta
  derivada, sem precisar de cron).
- **Revogação** é sempre uma ação explícita do psicólogo, disponível enquanto
  `status` não é `ANSWERED`.

---

## 9. Casos de uso

1. **Psicólogo convida paciente novo para o questionário de triagem inicial** — paciente
   ainda sem senha definida; aceita o convite, responde, opcionalmente define senha
   depois.
2. **Psicólogo convida paciente já ativo (com senha) para um questionário adicional** —
   paciente pode tanto usar o link do convite quanto (se preferir) logar normalmente e
   encontrar o questionário na lista geral (`/paciente/inicio`, comportamento inalterado).
3. **Paciente perde o e-mail / e-mail cai em spam** — psicólogo reenvia (INV-006) ou usa
   o link copiável direto (ex.: manda por WhatsApp).
4. **Paciente clica em link expirado** — vê tela de erro clara ("Este link expirou"),
   sem opção de auto-reenvio (por segurança, só o psicólogo reenvia); orientação para
   contatar o psicólogo.
5. **Paciente já respondeu e clica no link de novo** (ex.: e-mail antigo reaberto) — vê
   `EmptyState` "Você já respondeu este questionário", mesmo padrão hoje usado para
   acesso autenticado normal.
6. **Psicólogo revoga um convite enviado por engano** (paciente errado, questionário
   errado) — antes de ser respondido.

---

## 10. Regras de negócio

Consolidadas na tabela EARS de §7 (INV-001 a INV-010). Regras adicionais de fronteira:

| ID | Requisito |
|----|-----------|
| INV-011 | O sistema SHALL impedir que um psicólogo crie ou reenvie convite para paciente de outro psicólogo (checagem de posse, mesmo padrão de `InsertPatientService`/`AuthenticatedUserService`). |
| INV-012 | O JWT de escopo restrito emitido a partir de um convite SHALL autorizar apenas: ler o `Questionnaire` do convite, responder esse `Questionnaire`, e (se aplicável) definir a senha do próprio `Patient` — SHALL NOT autorizar qualquer outro endpoint. |
| INV-013 | O sistema SHALL NOT expor, em qualquer resposta de API, o token em claro após sua criação inicial (nem em logs). |

---

## 11. Critérios de aceite

- [ ] Psicólogo consegue convidar um paciente seu para um questionário específico a
      partir da tela de paciente ou de questionário.
- [ ] Paciente recebe e-mail com link; clicar no link leva direto ao wizard daquele
      questionário, sem tela de login.
- [ ] Paciente sem senha cadastrada consegue responder via convite e, opcionalmente,
      definir senha para acessos futuros.
- [ ] Link expirado exibe erro claro e não permite responder.
- [ ] Link já respondido exibe o mesmo `EmptyState` de "já respondido" hoje usado no
      fluxo autenticado.
- [ ] Psicólogo consegue reenviar e revogar convites, e ver o status atual de cada um.
- [ ] Nenhuma regressão no fluxo de login/resposta já existente (paciente com senha
      continua respondendo normalmente pela lista geral).
- [ ] 409 de resposta duplicada continua funcionando também no caminho do convite.
- [ ] Token nunca é logado nem devolvido em claro por nenhum endpoint depois de emitido.

---

## 12. Alterações necessárias no banco de dados

Ver modelo completo em §5. Resumo de migração:

```sql
CREATE TABLE questionnaire_invites (
    id BIGSERIAL PRIMARY KEY,
    id_patient BIGINT NOT NULL REFERENCES patients(id),
    id_questionnaire BIGINT NOT NULL REFERENCES questionnaires(id),
    id_psychologist BIGINT NOT NULL REFERENCES psychologists(id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    consumed_at TIMESTAMP,
    id_questionnaire_answer BIGINT REFERENCES questionnaire_answers(id),
    created_at DATE NOT NULL,
    updated_at DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX uq_invite_active_pair
    ON questionnaire_invites (id_patient, id_questionnaire) WHERE active = true;

ALTER TABLE users ALTER COLUMN password DROP NOT NULL; -- confirmar: já é nullable hoje (contas Google) — só o DTO de criação de paciente exige preenchida
```

> Como não há Flyway/Liquibase, esta migração precisa ser aplicada manualmente em
> produção (via pgweb, mesmo processo já usado na Fase 5a) **antes** do deploy do `/api`
> que passa a referenciá-la — mesma sequência (schema primeiro, deploy depois) já
> validada como necessária em incidentes anteriores.

---

## 13. Alterações de backend

Seguindo os padrões já confirmados no código (`architecture.md`, camadas
Controller→Service→Repository, DTOs em `controller/request|response/`, mappers,
validators, `ResponseStatusException` direto, injeção por construtor):

- **Novo domínio**: `domain/QuestionnaireInvite.java`, `enums/InviteStatus.java`.
- **Novo `InviteRepository`** (`JpaRepository`, finders por `tokenHash`, por
  `patientAndQuestionnaire`).
- **Novos services** (`service/invite/`):
  - `CreateInviteService` — cria ou reutiliza convite ativo (INV-001, INV-002, INV-004,
    INV-011), gera token, delega envio de e-mail.
  - `ResendInviteService` — rotação de token (INV-006).
  - `RevokeInviteService` — INV-007.
  - `ConsumeInviteService` — valida token (hash, expiração, status), emite JWT de escopo
    restrito (INV-005, INV-008, INV-010, INV-012).
  - `MailService` (novo pacote `service/mail/`) — abstrai envio; ver decisão de
    dependência em §17.
- **Novo filtro de autorização** `InviteScopedAuthorizationFilter`, mesmo padrão de
  `IncompleteProfileAuthorizationFilter`, restringindo o JWT de convite às rotas
  permitidas (INV-012).
- **Novos endpoints** — ver §14 (APIs).
- **Reuso, sem alteração**: `AnswerQuestionnaireService`, `AnswerQuestionnaireValidator`,
  `AccessTokenService`/`JwtEncoder` (para emitir o JWT restrito, com claims adicionais
  `scope=invite`, `questionnaireId`).

---

## 14. APIs necessárias

| Método | Rota | Quem chama | Descrição |
|---|---|---|---|
| `POST` | `/pacientes/{patientId}/questionarios/{questionnaireId}/convites` | Psicólogo (autenticado) | Cria (ou reutiliza) convite; dispara e-mail. INV-001..004, 011 |
| `POST` | `/convites/{id}/reenviar` | Psicólogo | Rotaciona token, reseta expiração. INV-006 |
| `DELETE` | `/convites/{id}` | Psicólogo | Revoga. INV-007 |
| `GET` | `/pacientes/{patientId}/convites` ou incluído em `GET /pacientes/{id}/avaliacoes` | Psicólogo | Lista status dos convites do paciente |
| `GET` | `/convites/validar?token=...` | Público (sem auth prévia) | Valida token, retorna metadados mínimos (título do questionário, nome do paciente) sem consumir |
| `POST` | `/convites/consumir` `{ token }` | Público (sem auth prévia) | Consome o token (uso único), emite JWT de escopo restrito. INV-005, 008, 010, 012 |
| `PUT` | `/pacientes/me/senha` (novo, se ainda não existir) | Paciente (via JWT restrito ou completo) | Define/troca senha própria — necessário para o passo opcional do fluxo (§6, passo 5) |

Todas expostas via `/api/*` no frontend automaticamente (BFF proxy já genérico, sem
alteração necessária nele).

---

## 15. Tratamento de erros

Reaproveitando o padrão já existente (`GlobalExceptionHandler`,
`ResponseStatusException` direto nos services, formato `{timestamp, status, error,
message, path}`):

| Cenário | Status | Mensagem sugerida |
|---|---|---|
| Token não encontrado / hash não bate | `404` | "Convite não encontrado." |
| Token expirado | `410 Gone` | "Este link expirou. Peça um novo convite ao seu psicólogo." |
| Convite revogado | `410 Gone` | "Este convite não está mais disponível." |
| Convite já respondido | `409` (mesmo padrão do 409 de resposta duplicada) | "Você já respondeu este questionário." |
| Convite para questionário já respondido por outra via (concorrência) | `409` | Mesma mensagem do 409 existente — reuso de `AnswerQuestionnaireService`. |
| Criar convite para paciente de outro psicólogo | `403` | Genérico, sem detalhar (evita enumeração). |
| Criar convite duplicado para par já com convite ativo | não é erro — reutiliza (INV-002); resposta `200` com o convite existente atualizado, não `409`. |

No frontend: estados bloqueantes (link expirado/revogado/já respondido) usam `Alert`/
`ErrorState` — **não toast** — seguindo a regra de design system já documentada em
`alert.tsx:23-27` para erros que bloqueiam o fluxo clínico.

---

## 16. Segurança (tokens, permissões, validade dos links)

Baseado em pesquisa externa (OWASP Authentication Cheat Sheet, práticas de magic link,
comparação JWT vs. token opaco — ver §21 fontes):

1. **Token opaco, não JWT, para o link do convite.** O link carrega um valor aleatório
   (≥ 128 bits de entropia, ex. 32 bytes aleatórios, codificado base64url). O servidor
   armazena **apenas o hash SHA-256** do token (`token_hash`), nunca o valor em claro —
   mesmo raciocínio de "senha nunca em claro", já aplicado no projeto para `password`
   (bcrypt). Motivo de usar opaco (não JWT auto-contido) aqui: precisa ser **revogável
   instantaneamente** (INV-007) e de **uso único verificável atomicamente** — um JWT
   autocontido não pode ser "invalidado" sem uma lista de revogação, o que anularia a
   vantagem de ser stateless.
2. **Consumo atômico (single-use real, não só checado antes)**: a troca do token deve
   ser um `UPDATE ... SET consumed_at = now(), status = 'OPENED' WHERE token_hash = ?
   AND consumed_at IS NULL AND expires_at > now()` — se `rowsAffected = 0`, rejeita.
   Evita corrida (duas abas abrindo o mesmo link ao mesmo tempo).
3. **JWT de escopo restrito, curto, para a sessão pós-consumo**: depois de consumir o
   token opaco, o backend emite um JWT (reaproveitando `AccessTokenService`/chaves RSA já
   configuradas) com expiração curta (ex. 30–60 min — tempo suficiente para completar um
   wizard de várias telas, mas não mais que isso), claim adicional `scope=invite` +
   `questionnaireId`, validado pelo novo `InviteScopedAuthorizationFilter` (mesmo padrão
   de `IncompleteProfileAuthorizationFilter`) para autorizar só as rotas de INV-012.
4. **Expiração do link em si (não da sessão)**: 7 dias — ver justificativa em §8. Isso é
   deliberadamente mais longo que a recomendação OWASP de ~15 min para links de *login*,
   porque este é um link de *convite assíncrono*, não de login instantâneo — a sessão de
   curto prazo (item 3) é o controle de segurança equivalente depois que o link é
   clicado.
5. **Rate limiting** na criação/reenvio de convites (ex.: N por paciente por hora) para
   evitar abuso de envio de e-mail — não existe rate limiting em nenhum endpoint hoje no
   projeto; este seria o primeiro caso, avaliar se vale um filtro simples ou se fica para
   uma iteração futura (documentar como dívida se adiado, não implementar
   silenciosamente sem registrar).
6. **Sem enumeração**: respostas de validação de token não devem diferenciar "token
   nunca existiu" de "token de outro paciente" — sempre 404 genérico.
7. **Transporte**: e-mail é canal não autenticado por natureza — o link não deve levar
   dado sensível na URL além do próprio token (nada de `patientId`/CPF na query string).

---

## 17. Impacto na arquitetura

Em termos de `docs/specs/architecture.md` (Bounded Contexts):

- Novo Bounded Context **Convites**, dependente de **Pacientes** e **Questionários**
  (análogo a como "Cadastro" depende de "Autenticação" hoje).
- Novo Shared Concept: "JWT de escopo restrito" — generaliza o padrão hoje só usado para
  "perfil incompleto", então vale atualizar `architecture.md` §1.3 (Shared Kernel) para
  descrever esse padrão como reutilizável, não exclusivo do fluxo de perfil.
- Ontologia (`docs/specs/ontology.md`) ganha os termos: **Convite de Questionário**,
  **Token de Convite**, **Sessão de Convite** (JWT restrito) — seguir o mesmo formato de
  tabela já usado no glossário.
- **Nova dependência de infraestrutura**: envio de e-mail. O projeto tem uma regra
  explícita (`architecture.md:162`, "Library Verification"): nenhuma dependência nova no
  `pom.xml` sem justificativa. **Decisão (2026-07-12): usar Zoho Mail via SMTP**
  (domínio próprio já configurado, `remindapp.com.br`), com `spring-boot-starter-mail` +
  `JavaMailSender` — sem necessidade de SDK/dependência de provedor terceiro (Resend/
  SendGrid), já que Zoho expõe SMTP padrão. Justificativa para o "Library Verification":
  `spring-boot-starter-mail` é a starter oficial do Spring Boot, único acréscimo real ao
  `pom.xml`; nenhuma lib de terceiro adicional é necessária. Configuração
  (`application.yaml`/`application-prod.yaml`, variáveis de ambiente no EasyPanel, não
  hardcoded):
  ```yaml
  spring:
    mail:
      host: smtppro.zoho.com   # confirmado no painel Zoho (conta "pro"/domínio próprio) — NÃO smtp.zoho.com
      port: 465
      username: ${ZOHO_MAIL_USERNAME}   # contato@remindapp.com.br (conta Zoho existente)
      password: ${ZOHO_MAIL_PASSWORD}   # senha de app do Zoho, não a senha da conta
      properties:
        mail:
          smtp:
            auth: true
            ssl:
              enable: true       # porta 465 = SSL implícito, não STARTTLS/587
            socketFactory:
              class: javax.net.ssl.SSLSocketFactory
              port: 465
  ```
  **Já concluído (2026-07-12)**: 2FA habilitado e senha de app gerada na conta
  `contato@remindapp.com.br`; host/porta confirmados no painel Zoho. Falta apenas SPF/
  DKIM no DNS (ver checklist abaixo) antes de considerar o envio pronto para produção.
- **Sem impacto** nos bounded contexts existentes de Autenticação/Pacientes/
  Questionários além de: (a) tornar `password` opcional na criação de paciente, (b)
  reaproveitar a emissão de JWT com um novo `scope`.

---

## 18. Plano de implementação dividido em etapas

**Fase A — Backend base**
1. Migrar schema (`questionnaire_invites`, `users.password` nullable no DTO).
2. `QuestionnaireInvite` + repository + `CreateInviteService`/`ResendInviteService`/
   `RevokeInviteService` (sem envio de e-mail ainda — só o link copiável já testa o
   fluxo ponta a ponta).
3. `ConsumeInviteService` + `InviteScopedAuthorizationFilter` + emissão do JWT restrito.
4. Endpoint `PUT /pacientes/me/senha`.

**Fase B — Frontend base**
5. `features/invites/` (schemas, api, componentes): botão "Convidar" na tela de paciente/
   questionário, modal com link copiável, `Badge` de status, ação de reenviar/revogar.
6. Página `/convite/[token]`: valida, consome, redireciona ao wizard existente
   (`questionnaire-wizard.tsx` sem alterações). Tela de erro (`Alert`/`ErrorState`) para
   expirado/revogado/já respondido.
7. Tela opcional "criar senha" pós-resposta (ou antes, a decidir — ver §20).

**Fase C — E-mail (provedor decidido: Zoho Mail via SMTP, ver §17) — concluída e validada
localmente em 2026-07-12, adiantada em relação às Fases A/B**
8. ~~Gerar senha de app no Zoho~~ ✅ feito (2FA + senha de app + host/porta confirmados).
9. ~~`spring-boot-starter-mail` + `MailService` + template de e-mail de convite~~ ✅ feito
   (`api/src/main/java/br/com/remind/service/mail/MailService.java`, identidade visual de
   `documentacao/idVisual/id.md` aplicada no template HTML).
10. ~~Testar envio real~~ ✅ feito — `MailServiceManualTest` (teste isolado, gated por
    `REMIND_MAIL_MANUAL_TEST`, sem depender de Spring context/Postgres) enviou e-mail real
    via `smtppro.zoho.com:465` e chegou na inbox. MX, SPF e DKIM todos propagados e
    verificados no DNS (`remindapp.com.br`) — a causa raiz de o primeiro teste não chegar
    foi MX ausente (SPF/DKIM/SMTP corretos não bastam sem MX apontando pro Zoho).
    **Pendente**: ligar `CreateInviteService`/`ResendInviteService` ao envio real — só é
    possível depois que a Fase A existir (ainda não implementada); e cadastrar as
    credenciais como segredo no EasyPanel antes de produção (ver checklist §19).

**Fase D — Polimento**
11. Rate limiting de criação/reenvio (se não adiado).
12. Telemetria simples de status de convite na tela do psicólogo (contadores).

Cada fase é entregável e testável isoladamente — nenhuma quebra o que já está em
produção (mesma diretriz de migração incremental já usada no redesign de UI/UX).

---

## 19. Checklist técnico

- [ ] Migração de schema aplicada em produção **antes** do deploy do `/api` (via pgweb,
      mesmo processo da Fase 5a).
- [ ] `token_hash` nunca logado (checar `logging.level` e qualquer `System.out`/log de
      debug introduzido durante o desenvolvimento).
- [ ] Teste de concorrência do consumo atômico do token (duas requisições simultâneas
      com o mesmo token → só uma sucede).
- [ ] Teste do 409 de resposta duplicada também pelo caminho do convite.
- [ ] Teste de convite expirado, revogado e já respondido (os 3 estados terminais em
      §7/§15).
- [ ] Teste de que o JWT de escopo restrito **não** autoriza nenhuma rota fora de
      INV-012 (ex.: tentar `GET /pacientes` com ele deve dar 403).
- [ ] Teste de que `password` opcional na criação de paciente não quebra os testes
      existentes de `InsertPatientService`.
- [x] **Envio real via Zoho SMTP validado (2026-07-12)**: `spring-boot-starter-mail` +
      `MailService` implementados; 2FA, senha de app, host/porta (`smtppro.zoho.com:465`
      SSL), SPF, DKIM e **MX** (faltava e foi a causa raiz do e-mail não chegar na 1ª
      tentativa — sem MX, a entrega falha mesmo com SPF/DKIM/SMTP corretos) todos
      configurados e confirmados; e-mail de teste (`MailServiceManualTest`) chegou na
      inbox. **Falta apenas**: cadastrar `ZOHO_MAIL_USERNAME`/`ZOHO_MAIL_PASSWORD` como
      variável de ambiente/segredo no EasyPanel antes de ativar em produção (validado só
      localmente até aqui).
- [ ] Verificar timezone dos timestamps (`sent_at`, `opened_at`, `expires_at`) contra o
      mesmo cuidado de timezone já necessário na Fase 4 (container em UTC vs. horário
      local do usuário).

---

## 20. Dúvidas encontradas durante a análise (para decisão do usuário/produto)

1. ~~**Provedor de e-mail**~~ — **resolvido (2026-07-12): Zoho Mail via SMTP**, remetente
   `contato@remindapp.com.br` (conta já existente, sem caixa dedicada nova). Ver §17/§18
   e checklist de configuração em `deploy-arquitetura` (memória) para os passos feitos
   fora do código (2FA, senha de app, SPF/DKIM).
2. **Quem inicia o convite — só psicólogo, ou também em lote (vários pacientes de uma
   vez para o mesmo questionário)?** Este PRD assume 1 convite = 1 paciente + 1
   questionário; convite em lote é uma extensão direta se necessário, mas muda a UI
   (seleção múltipla).
3. **Definir senha é obrigatório em algum momento, ou o paciente pode viver só de
   convites para sempre?** Se nunca obrigatório, o paciente nunca aparece na tela de
   login normal — é um modelo de uso válido (esperado para pacientes que só respondem
   1–2 vezes) ou o produto espera que todo paciente eventualmente tenha login próprio?
4. **`/paciente/inicio` deve migrar para "só questionários atribuídos"?** Este PRD manteve
   o comportamento atual (lista global) por segurança de escopo, mas isso deixa uma
   inconsistência: um paciente logado normalmente ainda vê e pode responder
   questionários não convidados. Se o objetivo de produto é realmente restringir
   (não só notificar), essa migração precisa entrar em algum momento — recomenda-se
   tratar como Fase 2 explícita, não implícita neste documento.
5. **Prazo de expiração de 7 dias é aceitável clinicamente?** Proposto por analogia com
   produtos de referência, mas o contexto é adolescentes com avaliação de risco — um
   prazo muito longo pode atrasar identificação de risco alto. Vale confirmar com quem
   define o protocolo clínico.
6. **Rate limiting fica para a Fase D ou é bloqueante para ir a produção?** Proposto como
   adiável, mas é uma superfície de abuso nova (spam de e-mail via convites) que não
   existia antes.

---

## 21. Referências

Pesquisa externa realizada para embasar §16 (segurança de tokens) e §8/§14 (padrões de
convite assíncrono em software clínico):

- [OWASP-aligned magic link security deep dive — MojoAuth](https://mojoauth.com/blog/are-magic-links-secure-technical-deep-dive)
- [Magic Link Security: Best Practices for Developers — Gupta Deepak](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/)
- [Magic link authentication — Logto / DEV Community](https://dev.to/logto/magic-link-authentication-2icf)
- [Passwordless email logins — Supabase Docs](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [JWT vs. Opaque Tokens — ZITADEL](https://zitadel.com/blog/jwt-vs-opaque-tokens)
- [JWT vs Opaque Tokens: API Token Strategy — Gupta Deepak](https://guptadeepak.com/jwt-vs-opaque-tokens-api-authentication-2026/)
- [A Guide to Bearer Tokens: JWT vs. Opaque Tokens — Permit.io](https://www.permit.io/blog/a-guide-to-bearer-tokens-jwt-vs-opaque-tokens)
- [Sending intake forms and documents to clients — SimplePractice Support](https://support.simplepractice.com/hc/en-us/articles/207925943-Sending-intake-forms-and-documents-to-clients)
- [Collect Intake Information With the Client History Form — TherapyNotes](https://support.therapynotes.com/hc/en-us/articles/30661445914651-Collect-Intake-Information-With-the-Client-History-Form)

Referências internas: `docs/specs/architecture.md`, `docs/specs/ontology.md`,
`docs/specs/001-login-google-psicologo/` (formato de spec seguido),
`.claude/specs/04-spec-aplicacao.md` (confirma a lacuna de atribuição já conhecida),
`PRD.md` (raiz, redesign de UI/UX — confirma que este fluxo não foi cogitado ali).

---

## 22. Status de implementação (atualizado conforme o código evolui)

> Diferente das seções 1–21 (planejamento), esta seção é **factual**: só descreve o que
> existe de fato em código/config/infra neste momento, para não exigir que quem for
> continuar a feature precise adivinhar o que já está pronto.

### Fase C — E-mail transacional (Zoho SMTP) — ✅ concluída e validada (2026-07-12)

**Infraestrutura de conta/DNS** (fora do repo, no Zoho + registro.br):
- Conta Zoho Mail `contato@remindapp.com.br` com 2FA habilitado e senha de aplicativo
  gerada para uso em SMTP.
- Host/porta confirmados no painel: `smtppro.zoho.com`, porta `465` (SSL implícito, **não**
  `smtp.zoho.com:587`/STARTTLS — variante genérica que estava no primeiro rascunho deste
  PRD e foi corrigida depois de checar o painel real).
- DNS de `remindapp.com.br` (registro.br) com os 3 registros de deliverability:
  - **SPF** (TXT, `@`): `v=spf1 include:zohomail.com ~all`.
  - **DKIM** (TXT, `remind._domainkey`): chave RSA 2048 bits gerada pelo Zoho.
  - **MX** (`@`): `mx.zoho.com` (10), `mx2.zoho.com` (20), `mx3.zoho.com` (50).
  - Todos os 3 confirmados propagados via `nslookup` e verificados no painel do Zoho.
- **Lição aprendida durante a validação**: o primeiro teste de envio rodou sem nenhum
  erro (o SMTP aceitou a mensagem), mas o e-mail nunca chegou — a causa era o **MX
  ausente**. SPF + DKIM + SMTP corretos não bastam; MX é quem decide se o e-mail chega
  à caixa. Isso não gera exceção do lado de quem envia, só se percebe pelo aviso do
  próprio painel Zoho ou pela ausência do e-mail. Vale relembrar isso em qualquer setup
  futuro de e-mail transacional em domínio novo.

**Código** (`api/`):
- `pom.xml`: dependência `spring-boot-starter-mail` adicionada.
- `application.yaml` (dev) e `application-prod.yaml`: config `spring.mail.*` apontando
  para `smtppro.zoho.com:465` com SSL; usuário/senha via `${ZOHO_MAIL_USERNAME}`/
  `${ZOHO_MAIL_PASSWORD}` (opcionais localmente, obrigatórios em prod); propriedade
  própria `remind.mail.from-name` (default `ReMind`).
- `service/mail/MailService.java` (novo): `sendQuestionnaireInvite(to, patientName,
  questionnaireTitle, inviteLink, expiresAt)`, usando `JavaMailSender` autoconfigurado
  pelo Spring Boot — sem SDK de provedor terceiro. Template HTML embutido segue à risca
  a paleta/fonte obrigatórias de `documentacao/idVisual/id.md`; nome do paciente e título
  do questionário são escapados (`HtmlUtils.htmlEscape`) antes de entrar no HTML; o token/
  link nunca é logado.
- `service/mail/MailServiceManualTest.java` (novo, em `src/test/`): teste isolado — sem
  `@SpringBootTest`/sem depender de Postgres local — que instancia `JavaMailSenderImpl`
  diretamente e chama `MailService` de verdade. Gated por
  `@EnabledIfEnvironmentVariable(named = "REMIND_MAIL_MANUAL_TEST", matches = "true")`,
  então **não roda** em `mvn test` normal nem em CI — só quando alguém define essa
  variável explicitamente junto com `ZOHO_MAIL_USERNAME`/`ZOHO_MAIL_PASSWORD` reais.
  Executado manualmente em 2026-07-12: e-mail chegou na inbox de
  `contato@remindapp.com.br` com sucesso.

**Pendente para produção** (não feito ainda):
- Cadastrar `ZOHO_MAIL_USERNAME`/`ZOHO_MAIL_PASSWORD` como variável de ambiente/segredo
  no EasyPanel — até aqui só foi testado localmente, com as variáveis definidas na sessão
  do PowerShell do desenvolvedor.
- Nada mais depende disso estar em produção agora, porque **ainda não há nenhum código
  que chame `MailService`** fora do teste manual (ver Fase A abaixo).

### Fase A — Entidade `QuestionnaireInvite`, migração de schema, criação/consumo de token — 🟡 em andamento (passo 1/4 concluído em 2026-07-12)

**Passo 1 — Migração de schema — ✅ concluído.**
- `api/data/schema.sql`: adicionado `DROP TABLE IF EXISTS questionnaire_invites CASCADE;`
  ao bloco de reset, e `CREATE TABLE questionnaire_invites` (+ 4 FKs, `UNIQUE(token_hash)`,
  e índice único parcial `UNIQUE(id_patient, id_questionnaire) WHERE active = true` — no
  máximo 1 convite ativo por par) ao final do arquivo. `users.password` **não precisou de
  alteração** — já era nullable (confirmado direto no Postgres local, `\d users`).
- DDL aplicado **manualmente** no Postgres local (porta 5432 nativa do Windows) — só o
  incremento novo, **não** o `schema.sql` inteiro (que começa com `DROP TABLE` em todas as
  tabelas e apagaria os dados locais existentes, já que não há Flyway/Liquibase). Tabela
  confirmada via `\d questionnaire_invites`: 4 FKs, as 2 constraints únicas e o índice
  parcial, todos presentes.
- **Achado colateral, fora do escopo deste PRD**: o Postgres local está com drift
  preexistente — `scale_risk_bands` e `questionnaire_scale_results` (tabelas da Fase 5a,
  presentes em `schema.sql`) **não existem** na base local, embora o `ddl-auto: validate`
  devesse acusar isso ao subir o backend. Mesmo padrão do drift já documentado
  anteriormente (memória `db-schema-drift-users`), só que em tabelas diferentes — não foi
  corrigido inicialmente por estar fora do escopo desta feature — mas acabou sendo
  corrigido de qualquer forma no passo 2 (ver abaixo), porque bloqueava a única forma
  real de validar a entidade nova (o backend não subia de jeito nenhum, mesmo sem
  relação com `questionnaire_invites`).
- **Ainda pendente dentro do passo 1**: aplicar o mesmo DDL em **produção via pgweb antes
  do próximo deploy do `/api`** (mesma ordem — schema antes do código — já validada
  necessária na Fase 5a). Não fazer isso ainda, só quando os passos 2–4 desta fase
  estiverem prontos para deploy junto.

**Passo 2 — Entidade `QuestionnaireInvite` + `InviteStatus` + repository — ✅ concluído.**
- `enums/InviteStatus.java` (`PENDING, SENT, OPENED, ANSWERED, EXPIRED, REVOKED`).
- `domain/QuestionnaireInvite.java` — segue exatamente o padrão das entidades existentes
  (`@Builder`, campos snake_case tipo `token_hash`/`expires_at` espelhando as colunas,
  como já é feito em `birth_date`/`answered_at`/`risk_label`).
- `repository/QuestionnaireInviteRepository.java` — `findByPatientAndQuestionnaireAndActiveTrue`
  (derivado normalmente) e `findByTokenHash` (via `@Query` JPQL explícita — **primeira
  `@Query` do projeto**, necessária porque o Spring Data tenta interpretar o `_` de
  `token_hash` como separador de caminho aninhado ao derivar o nome do método, e erra;
  `@Query("select qi from QuestionnaireInvite qi where qi.token_hash = :tokenHash")`
  resolve sem abrir mão do padrão snake_case do domínio).
- **Validado de verdade**, não só por compilar: subi o backend localmente
  (`./mvnw spring-boot:run`) com `ddl-auto: validate` e confirmei
  `Started RemindApplication` sem erro de schema — a entidade bate 100% com a tabela
  criada no passo 1. Isso só foi possível depois de corrigir o drift preexistente
  (`scale_risk_bands`/`questionnaire_scale_results` recriadas localmente, DDL do próprio
  `schema.sql`), senão o boot falhava por causa deles antes mesmo de chegar a validar
  `questionnaire_invites`.

**Passo 3 — Services (criação/reenvio/revogação/consumo) + filtro de JWT de escopo
restrito — ✅ concluído (2026-07-12).**
- `service/invite/InviteTokenGenerator.java` — gera o token opaco (256 bits, Base64
  URL-safe) e seu hash SHA-256; só o hash é persistido (PRD §16).
- `service/invite/CreateInviteService.java` — INV-001/002/004/011: cria ou reutiliza o
  convite do par paciente/questionário, gera token, envia e-mail via `MailService`,
  marca `SENT`.
- `service/invite/ResendInviteService.java` — INV-006: rotaciona o token do mesmo
  registro (não cria um segundo) e reenvia.
- `service/invite/RevokeInviteService.java` — INV-007: marca `REVOKED` e libera o par
  (`active=false`) para um convite futuro.
- `service/invite/ConsumeInviteService.java` — INV-005/008/010: consumo atômico do token
  via `QuestionnaireInviteRepository.consumeByTokenHash` (UPDATE condicional, não
  select-then-update) e emissão do JWT de escopo restrito.
- `service/login/AccessTokenService.java` ganhou `generateInviteScoped(...)` +
  `INVITE_EXPIRES_IN` (1800s) — reaproveita o mesmo `JwtEncoder`/chaves RSA já
  configurados, com claims extras `scope=invite` e `questionnaireId` (como `String`, para
  evitar ambiguidade de tipo numérico na (de)serialização do JWT).
- `config/InviteScopedAuthorizationFilter.java` — mesmo padrão de
  `IncompleteProfileAuthorizationFilter`: bloqueia (403) qualquer rota fora de
  `GET/POST /questionarios/{id}[/responder]` (só o `{id}` do claim) e
  `PUT /pacientes/me/senha`, quando o JWT carrega `scope=invite`. Registrado em
  `SecurityConfig` via `addFilterAfter(..., BearerTokenAuthenticationFilter.class)`.
- Novos DTOs (`controller/response/invite/{InviteResponse,ConsumeInviteResponse}`) +
  `mapper/invite/InviteMapper`. Config nova: `remind.invite.base-url` (dev
  `http://localhost:3000`, prod `https://remindapp.com.br`) e
  `remind.invite.expiration-days` (7, default).

**Validado de verdade, não só compilado**:
1. Subi o backend local de novo (`./mvnw spring-boot:run`) — contexto completo iniciou
   sem erro, o que já valida a sintaxe da `@Query` JPQL do consumo atômico (Spring Data
   valida `@Query` no bootstrap do repository, não na primeira chamada).
2. Escrevi `QuestionnaireInviteRepositoryTest` (`@DataJpaTest`, H2, mesmo padrão de
   `UserRepositoryTest`) com 6 casos cobrindo o consumo atômico: sucesso, expirado,
   revogado/inativo, já respondido, e **dupla tentativa no mesmo token retornando 0 na
   segunda** (prova sequencial de uso único — a atomicidade real contra corrida vem do
   próprio `UPDATE ... WHERE consumed_at IS NULL AND expires_at > NOW()` condicional,
   que o Postgres executa com lock de linha). Todos os 6 passaram.
3. Rodei a suíte inteira (`./mvnw test`) — **36 testes, 0 falhas** (1 pulado, o
   `MailServiceManualTest` gated).

**Bug real encontrado e corrigido nesse processo**: os testes de contexto completo já
existentes (`RemindApplicationTests`, `LoginGoogleE2ETest`, 6 testes no total) começaram
a falhar com `APPLICATION FAILED TO START` — `MailService` exige um bean
`JavaMailSender`, que o Spring só autoconfigura quando `spring.mail.host` está presente,
e o `application.yaml` de teste (`api/src/test/resources/application.yaml`, H2) não
tinha isso. Corrigido adicionando `spring.mail.host`/`username` mínimos (só para o bean
existir — nenhum teste de contexto completo dispara envio real) e
`remind.invite.base-url`/`mail.from-name` (propriedades sem default que os novos
services exigem). Lição: qualquer `@Value` sem default e qualquer bean condicional novo
precisa ser conferido contra `src/test/resources/application.yaml` também, não só contra
`application.yaml`/`application-prod.yaml`.

**Passo 4 — Endpoints REST — ✅ concluído e validado com HTTP real (2026-07-12).**
- `POST /pacientes/{patientId}/questionarios/{questionnaireId}/convites` — adicionado em
  `PatientController` (segue o precedente já existente de recurso aninhado, igual
  `/pacientes/{id}/avaliacoes`).
- `POST /convites/{id}/reenviar`, `DELETE /convites/{id}`, `POST /convites/consumir` —
  novo `InviteController` (`/convites`).
- `controller/request/invite/ConsumeInviteRequest.java` (novo DTO, `@NotBlank token`).
- `SecurityConfig`: `POST /convites/consumir` liberado como `permitAll()` (paciente ainda
  sem sessão ao clicar o link) — os demais continuam exigindo Bearer JWT normalmente.

**Dois bugs reais encontrados e corrigidos durante a validação com HTTP de verdade**
(não capturados pelos testes de repository/contexto, só aparecem no fluxo completo):

1. **Reenvio/reuso não resetava `consumed_at`/`opened_at`.** Ao reutilizar um convite já
   aberto (`CreateInviteService`) ou reenviar (`ResendInviteService`), o token era
   rotacionado mas `consumed_at` do consumo anterior continuava preenchido — como o
   `UPDATE` atômico exige `consumed_at IS NULL`, o token novo nunca conseguiria ser
   consumido (se autodestruía na hora de nascer). Corrigido zerando `opened_at`/
   `consumed_at` nos dois services sempre que o token é rotacionado.
2. **Mensagem errada ao reabrir o mesmo link já usado** (sem ter havido reenvio):
   `ConsumeInviteService` caía no branch genérico "Este link expirou" mesmo quando o link
   só tinha sido usado antes, não expirado de fato. Corrigido com uma checagem específica
   (`consumed_at != null` → "Este link já foi utilizado.") antes do fallback de expiração.

**Validação ponta a ponta via HTTP real** (backend local + Postgres local + Zoho SMTP
real — paciente de teste com e-mail temporariamente apontado para
`contato@remindapp.com.br`, revertido ao original depois, ver memória do projeto):
1. Login como psicóloga seedada → JWT.
2. `POST .../convites` → convite criado, `status=SENT`, e-mail chegou de verdade na
   inbox.
3. `POST /convites/consumir` (sem token de auth, rota pública) → JWT de escopo restrito
   emitido corretamente (`scope=invite`, `questionnaireId` certo).
4. `GET /questionarios/{id}` com o JWT restrito → **200** (dentro do escopo).
5. `GET /pacientes` com o mesmo JWT restrito → **403** com a mensagem certa (fora do
   escopo, INV-012 confirmado na prática).
6. Reconsumir o mesmo token → **410**, mensagem certa (achado do bug #2 acima).
7. `POST /convites/{id}/reenviar` → token rotacionado, novo e-mail enviado.
8. Consumir o **token novo** do reenvio → **200** (prova o fix do bug #1 — sem ele, teria
   dado 410 incorretamente).
9. `DELETE /convites/{id}` (revoke) num convite nunca consumido → **204**, depois
   consumir → **410** "não está mais disponível" (distinto do 409/expirado).
10. Psicóloga diferente tentando convidar paciente de outra psicóloga →
    **404** "Paciente não encontrado" (INV-011 confirmado, sem enumeração).

Suíte automatizada re-executada depois dos 2 fixes: **36 testes, 0 falhas** (1 pulado).

### INV-009 — Fechar o ciclo com `AnswerQuestionnaireService` — ✅ concluído (2026-07-12)

Gap encontrado depois do passo 4: nada transicionava o convite para `ANSWERED` quando o
paciente efetivamente terminava de responder — `AnswerQuestionnaireService` (código já em
produção) não sabia que convites existiam. Sem isso, um convite respondido com sucesso
ficaria preso em `OPENED` para sempre.

**Corrigido** (opção (a) discutida: o próprio `AnswerQuestionnaireService` busca e
atualiza o convite, em vez de um listener/evento separado): depois de salvar a
`QuestionnaireAnswer`, busca `findByPatientAndQuestionnaireAndActiveTrue` — se existir um
convite ativo para o par, marca `status=ANSWERED` e vincula `id_questionnaire_answer`. Sem
efeito para respostas fora do fluxo de convite (o `findBy...` simplesmente não encontra
nada — nenhuma mudança de comportamento para o fluxo já existente e testado em produção).

**Validado com HTTP real, não só teoricamente**: inserido um convite manualmente via SQL
(hash SHA-256 calculado à mão, sem precisar do Zoho/e-mail real para este teste
específico), consumido via `/convites/consumir`, e usado o JWT de escopo restrito para
**responder de verdade** as 11 perguntas do questionário via
`POST /questionarios/1/responder` (endpoint já existente, sem nenhuma alteração). Resultado
confirmado direto no Postgres: `questionnaire_invites.status = 'ANSWERED'` e
`id_questionnaire_answer` apontando para o `QuestionnaireAnswer` real gerado. Dados de
teste (convite, resposta, resultado) limpos depois. Suíte completa re-executada: **36
testes, 0 falhas**.

**Fase A completa** (passos 1–4 + INV-009). Falta só aplicar a migração de schema em
produção via pgweb quando for deployar (ver checklist §19), criar o endpoint
`PUT /pacientes/me/senha` que o `InviteScopedAuthorizationFilter` já pressupõe mas que
ainda não existe (necessário antes da Fase B se o fluxo depender de definir senha), e
decidir os itens em aberto de §20.

### Fase B — Frontend (`features/invites/`, página `/convite/[token]`) — ✅ concluída e validada (2026-07-12)

**Decisão de arquitetura tomada** (não estava explícita no planejamento original): como o
paciente "entra" via convite sem senha, reaproveitando 100% do wizard/sessão já
existentes? Duas opções levantadas — (a) adicionar um segundo provider `Credentials`
("invite") ao NextAuth que troca o token por uma sessão normal, reaproveitando
`requireRole`/middleware/wizard sem tocar neles; (b) construir um mini-fluxo paralelo,
público, desacoplado da sessão. Escolhida a opção (a): menor superfície nova, reaproveita
tudo que já é testado em produção. `types/next-auth.d.ts` ganhou `questionnaireId`/
`questionnaireTitle` opcionais em `User`/`Session` (só presentes em sessões de convite)
para o client saber pra onde redirecionar depois do `signIn()`.

**Backend — pequeno adicional que faltava**: não existia endpoint pra listar os convites
de um paciente (o psicólogo não tinha como ver status/reenviar/revogar pela UI sem isso).
Adicionado `GET /pacientes/{patientId}/convites` (`ListPatientInvitesService` +
`ListPatientInviteResponse` — sem `inviteLink`, nunca reexposto fora da criação/reenvio) +
`findByPatientAndActiveTrue` no repository.

**Frontend criado**:
- `features/invites/{schemas.ts,api.ts}` — Zod + hooks TanStack Query
  (`usePatientInvites`, `useCreateInvite`, `useResendInvite`, `useRevokeInvite`), mesmo
  padrão de `features/patients/`.
- `features/invites/components/{invite-status-badge,invite-dialog,patient-invites-section}.tsx`
  — seção "Convites" na página de detalhe do paciente (`app/(app)/psicologo/pacientes/[id]/page.tsx`),
  reaproveitando `Dialog`/`AlertDialog`/`DropdownMenu`/`EmptyState`/`LoadingState` do
  design system, sem componente novo. Link copiado pro clipboard automaticamente ao
  criar/reenviar (nunca reexibido depois — token só existe em memória nesse momento).
- `lib/auth/config.ts` — novo provider `Credentials({ id: "invite" })`, chama
  `POST /convites/consumir`, propaga erro específico do backend via `CredentialsSignin.code`
  (sem genericizar mensagem — diferente do login, não há razão de segurança aqui).
- `app/convite/[token]/page.tsx` + `features/invites/components/consume-invite-view.tsx`
  — rota pública nova (fora de `(app)`/`(auth)`, fora do matcher do `middleware.ts`),
  Client Component chama `signIn("invite", {token})` e redireciona ao wizard já existente
  via `session.user.questionnaireId`.

**Registro de design (skill `impeccable`, registro "product")**: telas do psicólogo
seguem o registro "restrained" (nada de card grid genérico, reaproveita exatamente os
componentes/paddings já usados na mesma página — earned familiarity, não novidade
visual). A página `/convite/[token]` **não** reaproveita o `AuthBrandPanel` do login
(tom "clínico/dado" — apropriado pra psicólogo, errado pra um adolescente respondendo
pelo celular) — layout próprio, mínimo, calmo, consistente com o tom já estabelecido do
wizard ("responda com calma, no seu tempo").

**Validado com HTTP real, não com um browser de verdade** (sem ferramenta de automação de
browser disponível neste ambiente — checked e comunicado explicitamente, não assumido):
`npm run typecheck`/`npm run lint` limpos; backend + frontend (`next dev`, `API_URL`
forçado pra localhost — **`.env.local` aponta pra produção por padrão**, cuidado ao rodar
`npm run dev` sem sobrescrever) rodando lado a lado; fluxo completo replicado via curl
imitando o que `signIn()` faz por baixo (`GET /api/auth/csrf` → `POST
/api/auth/callback/invite` → `GET /api/auth/session`), confirmando a sessão criada com
`questionnaireId` certo; página do wizard buscada via SSR com esses cookies, `200`, com o
título **e o texto real de uma pergunta** na resposta — confirma que renderizou o wizard
de verdade, não só o shell. Página do psicólogo também buscada via SSR logado — `200`,
seção "Convites" presente. Endpoint de listagem testado direto via o proxy `/api/*`.

**Bug crítico encontrado e corrigido nessa validação** (só apareceu testando via HTTP
real, nenhum teste anterior pegou): a própria página do wizard
(`responder/page.tsx`, código já existente) chama `GET /questionarios/{id}/resultado`
(auto-serviço do paciente) pra checar "já respondido?" antes de renderizar — essa rota
**não estava liberada** no `InviteScopedAuthorizationFilter`. Resultado: **403** em vez do
404 esperado, a página não trata 403, e o Server Component lançava exceção não tratada →
**erro 500 sempre que um paciente abria o link do convite**. Sem esse teste de ponta a
ponta via SSR, esse bug só apareceria em produção, com um paciente de verdade. Corrigido
adicionando `GET /questionarios/{id}/resultado` ao allow-list do filtro. Suíte completa
re-executada depois do fix: 36 testes, 0 falhas.

**Pendente**: tela opcional de "criar senha" (§6 passo 7, PRD §20 dúvida #3 ainda em
aberto) — não implementada, já que `PUT /pacientes/me/senha` também não existe ainda
(ver Fase A). Sem isso, hoje o paciente que só usa convites nunca ganha login próprio —
aceitável como está, mas é uma decisão de produto pendente.

### Fase D — Rate limiting e telemetria de convite — ❌ não iniciada

Sem mudança em relação ao planejamento original (§18).
