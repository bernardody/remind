# PRODUCTION_AUDIT.md — Auditoria Completa Pré-Produção do Remind

**Data:** 2026-07-21
**Escopo:** backend (`api/`, Spring Boot 4 / Java), frontend (`remind-web/`, Next.js 15 / React 19), banco de dados (PostgreSQL), infraestrutura de deploy (EasyPanel + Traefik / Vercel).
**Método:** leitura integral de controllers, services, repositories, filters, config, schema SQL, migrations, componentes de frontend, schemas de validação, middleware, BFF proxy, autenticação (NextAuth/JWT/Google OAuth), Dockerfile e configs de ambiente.

---

# Resumo Executivo

O Remind é um produto tecnicamente bem estruturado em vários aspectos — separação clara de camadas no backend, isolamento multi-tenant psicólogo↔paciente bem implementado na maior parte dos endpoints, código limpo (zero `console.log`/`TODO`/dead code relevante), testes de backend reais para os fluxos mais críticos (login, cálculo de escala, evolução longitudinal) e um BFF frontend com boas práticas de cookie httpOnly. Isso não é um projeto amador.

Mas **não está pronto para receber psicólogos e pacientes reais hoje**. Foram encontrados problemas que vão desde uma vulnerabilidade que **derruba completamente a autenticação do sistema** (chave privada de assinatura de JWT commitada no repositório e reutilizada em produção), até **resultados clínicos exibidos ao psicólogo baseados em cortes de risco inventados/placeholder** (idênticos para 8 escalas psicológicas diferentes), passando por **dois bugs que afetam 100% dos pacientes reais** no fluxo de resposta a questionário (tela final quebrada e sessão expirando antes do prometido, com perda de respostas). Some-se a isso: zero observabilidade de erro em produção (nenhum log de exceção, nenhum APM), zero CI/CD travando commits quebrados antes do deploy automático, e CORS totalmente aberto.

Nenhum desses itens é difícil de corrigir individualmente. O problema é o acúmulo: são exatamente o tipo de falha que um MVP "empurrado rápido" acumula quando segurança, observabilidade e QA de fluxo ponta-a-ponta não são tratados como gate de lançamento. Dado que o produto vai lidar com dados de saúde mental de pacientes reais (LGPD, dado sensível por natureza), a barra para "pronto" precisa ser mais alta do que está agora.

**Veredito resumido:** corrigível em dias, não em meses — mas não deve ir ao ar no estado atual.

---

# Problemas Críticos

Itens que **bloqueiam produção**. Cada um pode causar dano direto e imediato a psicólogos/pacientes reais ou comprometer a integridade/segurança do sistema inteiro.

1. **Chave privada RSA de assinatura de JWT commitada no repositório e usada em produção sem override** (`api/src/main/resources/authz.pem`, `SecurityConfig.java:36-40,72-77`, sem override em `application-prod.yaml`). Qualquer pessoa com acesso ao histórico do repositório pode forjar tokens válidos para **qualquer** psicólogo ou paciente, inclusive tokens de escopo de convite. Derruba toda a fronteira de autenticação e multi-tenant do produto. **Bloqueador absoluto.**

2. **Faixas de risco clínico (`risk_label`) são placeholders idênticos para as 8 escalas cadastradas**, sem nenhum corte validado na literatura (`api/data/insert.sql:49-77`, `migration_2026-07-16_novas_escalas.sql:132-145` — o próprio código admite "cortes placeholder... trocar pelos cortes clínicos reais quando definidos"). O psicólogo vê "Alto risco"/"Moderado"/"Baixo" como se fosse resultado clínico validado, quando é um número genérico. Isso é uma decisão de produto com risco direto a pacientes.

3. **Erros 5xx nunca são logados no backend** (`GlobalExceptionHandler.java`, nenhuma chamada de log em nenhum handler). Combinado com ausência total de Sentry/APM, um incidente em produção só é descoberto se o usuário reclamar — inaceitável para dado de saúde.

4. **Mensagens de exceção internas vazam em respostas HTTP mesmo em produção**, apesar de `application-prod.yaml` declarar `include-message: never` — essa config não tem efeito porque o `GlobalExceptionHandler` customizado sempre injeta `ex.getMessage()` no corpo da resposta (`GlobalExceptionHandler.java:53-87`). Vaza detalhes de driver JDBC, nomes de coluna/constraint, stack de exceção.

5. **`MethodArgumentNotValidException` (falha de `@Valid`) retorna HTTP 500 em vez de 400**, com mensagem verbosa do Spring exposta ao cliente — nenhum handler dedicado existe. Qualquer erro de validação de formulário vira "erro de servidor" no frontend.

6. **Zero CI/CD** (`.github/workflows` não existe). Combinado com o fato já conhecido de que o deploy do `/api` é automático a cada push, nada impede hoje que um commit quebrado (não compila, testes falhando, `next build` falhando) chegue direto em produção.

7. ~~**[Fluxo paciente — P0] Tela de confirmação pós-envio quebra para 100% dos pacientes convidados.**~~ **✅ CORRIGIDO em 2026-07-21.** O único botão disponível ("Voltar ao início") batia numa rota bloqueada pelo `InviteScopedAuthorizationFilter` para sessões de escopo de convite, gerando 403 em loop de retry infinito. Ver detalhes e correção aplicada em Bugs Encontrados #B-PAC-1.

8. ~~**[Fluxo paciente — P0] Sessão do paciente expira em 10 minutos, não nos 30 minutos que o próprio backend pretende conceder**~~ **✅ CORRIGIDO em 2026-07-21.** (`AccessTokenService.INVITE_EXPIRES_IN = 1800`, mas `NextAuth session.maxAge = 600` global, sem override por provider). Um paciente respondendo com calma um questionário de 20+ itens era derrubado da sessão e perdia todo o progresso, sem poder logar de novo (token de convite é de uso único). Ver Bugs Encontrados #B-PAC-2.

---

# Problemas Importantes

Não bloqueiam produção isoladamente, mas devem ser corrigidos rapidamente após ou junto com os críticos.

- **CORS totalmente aberto** (`CorsConfig.java`: `*` em origin/method/header) — confirmado por três auditorias independentes (backend, frontend, DevOps).
- **Sem rate limiting/lockout em `/login`** — abre porta para força bruta contra contas de psicólogos e pacientes.
- **Timing side-channel em `/login` permite enumerar e-mails cadastrados** (BCrypt só roda quando o usuário existe, diferença de latência mensurável).
- **Open Redirect via `callbackUrl`** no pós-login (`login-form.tsx:63-66`, `google-sign-in-button.tsx:75-76`) — vetor de phishing pós-autenticação real e de exploração simples.
- **Nenhuma página de erro/404 customizada no Next.js** (`error.tsx`/`not-found.tsx`/`global-error.tsx` inexistentes em toda a árvore) — qualquer exceção não tratada cai na tela crua padrão do framework.
- **N+1 duplicado no envio de resposta de questionário** (`AnswerQuestionnaireValidator` + `AnswerQuestionnaireService` repetem as mesmas ~2N queries cada, ~4N SELECTs por submissão).
- **Sem validação de CPF duplicado entre pacientes** — dois pacientes diferentes podem ter o mesmo CPF sem aviso.
- **`users.email`/`users.cpf` sem constraint `UNIQUE` no banco** — proteção de duplicidade é só check-then-act em memória, sujeita a corrida.
- **ID de rota não numérico gera 500 técnico em vez de 404 amigável** (`/psicologo/pacientes/abc` → `NaN` → erro de conversão Java exposto).
- **Tela de erro de convite é um beco sem saída** — sem botão de retry, sem contato de suporte, para um paciente que pode estar emocionalmente vulnerável.
- **Server Component do wizard sem try/catch na segunda chamada** — se o psicólogo excluir o paciente no meio da resposta, a página quebra com crash cru (sem `error.tsx` para pegar).
- **Nenhum `loading.tsx` nas rotas do paciente** — navegação parece travada em rede lenta/mobile.
- **Cobertura de teste do frontend autenticado é praticamente nula** (só landing page e schema de lead têm teste; wizard, CRUD de paciente, convites, relatórios não têm nenhum).
- **`next-auth` em versão beta (`5.0.0-beta.31`)** gerenciando toda a sessão/autenticação de produção.
- **Nenhum log de auditoria/segurança** no backend (login, consumo de convite, exclusão de paciente — nada é registrado).
- **Falta `@PreAuthorize`/autorização declarativa por papel** — toda a separação psicólogo/paciente depende de cada service lembrar de checar manualmente.
- **Timestamps sem timezone** (`TIMESTAMP` em vez de `TIMESTAMP WITH TIME ZONE`) nas colunas de expiração/consumo de convite — risco de recorrência do bug de timezone já visto na Fase 4, desta vez no lado SQL nativo (`CURRENT_TIMESTAMP` comparado a valor naive).
- **Falta `UNIQUE` físico em `questionnaire_results`/`questionnaire_scale_results`** — anotação JPA existe mas banco não garante (projeto roda com `ddl-auto: validate`).

---

# Melhorias

Itens de backlog de hardening, não bloqueantes:

- Adicionar CSP e confirmar HSTS explícito.
- Rate limiting em `/api/leads`.
- Validação de dígito verificador de CPF (mod-11), não só tamanho.
- `.max()` em campos de texto livre nos schemas Zod (nome, rua, bairro, cidade).
- Política de senha mínima mais forte que 6 caracteres.
- Índices em colunas de FK de alto uso (`patients.id_psychologist`, `scale_risk_bands.id_scale`, etc.).
- `FK ... ON DELETE` explícito em vez de implícito (documentar a intenção).
- `CHECK (min_value < max_value)` + `UNIQUE (id_scale, label)` em `scale_risk_bands`.
- Query paginada em `GetPatientQuestionnaireResultService` (hoje busca todo o histórico para usar 1 registro).
- Timeouts explícitos em chamadas ao Google JWKS e SMTP.
- Remover PNGs de logo órfãos (~5.6MB não referenciados) e recomprimir `hero-bg.png` (2MB).
- Corrigir `ISSUER = "tcc"` no JWT e metadados boilerplate do `pom.xml`.
- Botão "Editar" na revisão do wizard obrigando percorrer todas as perguntas seguintes até voltar — fricção desnecessária.
- Diferenciar mensagens de erro por código HTTP no wizard (já respondido vs. paciente excluído vs. erro de rede) em vez de toast genérico.
- HEALTHCHECK no Dockerfile.

---

# Fluxo Psicólogo

Simulação completa do primeiro login até o uso diário (ver detalhes por bug na seção Bugs Encontrados).

**Funciona bem:**
- Primeiro login Google com e-mail não pré-cadastrado dá erro 403 claro e específico, sem tela confusa.
- Convites: criação, reenvio (rotaciona token), revogação (derruba o link imediatamente) — bem desenhados e sem falhas encontradas.
- IDOR: testado em todos os endpoints de paciente/resultado/evolução/respostas — nenhum vazamento cross-tenant encontrado; um psicólogo não acessa dado de paciente de outro.
- Botões de criar paciente/convite desabilitam corretamente durante submit (proteção básica de duplo clique).
- Gaps de funcionalidade (sem tela de criar questionário, perfil só leitura) são **documentados no próprio código** como limitação conhecida, não bugs escondidos.

**Quebra ou incomoda:**
- Sem validação de CPF duplicado (Alto).
- Exclusão de paciente é soft-delete sem cascade — paciente "excluído" no meio de um questionário consegue responder até o fim e falha só no envio final, com mensagem que sugere "tentar de novo" (nunca vai funcionar).
- `UpdatePatientService`/`DeletePatientService` não filtram `active`, inconsistente com `GetPatientService` (que já dá 404 para inativos).
- Completar perfil: recarregar a página no meio perde os 7 campos preenchidos, sem aviso.
- Navegar para URL com ID inválido (`/pacientes/abc`) gera 500 cru em vez de 404 amigável.
- 403 em relatórios (paciente de outro psicólogo, via URL manipulada) cai em loop de retry sem nunca explicar o motivo.
- Sem máscara de CPF ao vivo no formulário de paciente (inconsistente com o formulário de completar perfil, que tem).

---

# Fluxo Paciente

Simulação completa: recebimento do convite → wizard → envio → confirmação.

**Funciona bem:**
- Mensagens de erro de convite (expirado/revogado/já usado/já respondido) são claras, específicas e em português não-técnico.
- Dupla submissão protegida corretamente (client desabilita botão + backend usa UPDATE atômico condicional, não check-then-act).
- Reentrada pós-resposta: o fix do commit `5b4c633` está correto — progresso do wizard é chaveado por `inviteId`, e o estado "já respondido" é sempre consultado no servidor, não em cache local.
- Acessibilidade do wizard é sólida (RadioGroup real, navegação por teclado, foco visível, aria-labels).
- Progresso salvo em `sessionStorage` sobrevive a F5/fechamento acidental de aba (dentro da mesma aba).

**Quebra ou incomoda (por ordem de gravidade):**
- **P0 — Tela de confirmação pós-envio quebra para todo mundo** (ver Crítico #7).
- **P0 — Sessão expira antes do prometido, causando perda total de respostas** (ver Crítico #8).
- Tela de erro de convite não tem nenhuma ação disponível — beco sem saída.
- Excluir o paciente no meio da resposta e ele dar F5/navegar causa crash cru (sem página de erro customizada para amparar).
- Nenhum `loading.tsx` nas rotas do paciente — parece travado em conexão lenta.
- Editar uma resposta na tela de revisão obriga percorrer todas as perguntas seguintes de novo até voltar à revisão.
- Duplicar a aba do navegador no meio do wizard (ação comum) pode gerar um 409 confuso ao tentar enviar pela aba desatualizada.
- Suspeita (não confirmada, precisa checagem em produção) de divergência de timezone entre a JVM e o timezone do Postgres nas checagens de "convite ainda válido".
- Toast de erro genérico no envio não diferencia "tente de novo" de "isso não vai se resolver tentando de novo".

---

# Segurança

Consolidado das auditorias de backend e frontend, por severidade.

## Crítico
- Chave privada JWT commitada e reutilizada em produção (`authz.pem`) — ver Crítico #1.

## Alto
- CORS aberto (`*` em origin/método/header).
- Sem rate limiting em `/login` (força bruta possível).
- Mensagens de exceção internas vazando em 500s, mesmo com config dizendo o contrário.
- Open Redirect via `callbackUrl` no pós-login.

## Médio
- Timing side-channel em `/login` permite enumeração de e-mail cadastrado.
- `CompleteProfileService` não verifica explicitamente `UserType.PSYCHOLOGIST` (hoje não explorável, mas sem defesa em profundidade).
- Sem `@PreAuthorize`/autorização declarativa — toda separação de papel depende de lembrar de checar manualmente em cada service.
- Endpoint `/pacientes/me/senha` referenciado no filtro de segurança mas nunca implementado (fluxo de "paciente define senha própria" incompleto).
- Nenhum log de auditoria/segurança (login, consumo de convite, exclusão de paciente).
- BFF proxy repassa qualquer path do backend sem allowlist por escopo de sessão (defesa em profundidade ausente, backend é a única linha).
- Sem CSP/HSTS explícitos no `next.config.ts`.
- Sem rate limit em `/api/leads`.
- Token de convite trafega na URL (mitigado parcialmente por `robots: noindex` e `Referrer-Policy`, mas ainda fica em histórico do navegador).
- CPF validado só por tamanho, sem dígito verificador.

## Baixo
- `application.yaml` (perfil default) mantém `postgres/postgres` como fallback de credenciais — só é risco se o deploy rodar sem `SPRING_PROFILES_ACTIVE=prod`.
- `InsertPatientRequest.email` sem `@Email` (só `@NotBlank`).
- `SearchUserService` (busca cross-tenant por nome/e-mail) está morto hoje, mas seria um vazamento grave se exposto sem guard de admin no futuro.
- `AccessTokenService` usa `user.getName()` como `subject` do JWT em vez de identificador estável.
- Campos de texto sem `.max()` nos schemas Zod de paciente/perfil.
- Senha mínima de 6 caracteres sem política de complexidade.
- Respostas do questionário em `sessionStorage` sem criptografia (aceitável para o modelo de ameaça atual, mas registrado por ser dado de saúde mental).

## Confirmado como correto (não é achado, mas validado ativamente)
- Nenhuma SQL Injection encontrada — todas as queries usam JPQL parametrizado.
- IDOR: zero vazamento cross-tenant em qualquer endpoint psicólogo→paciente auditado.
- `GoogleTokenVerifier` valida assinatura via JWKS real, issuer, audience e expiração corretamente.
- `InviteTokenGenerator`: 256 bits de entropia via `SecureRandom`, hash SHA-256 persistido, consumo atômico.
- Token JWT nunca chega ao client JS (fica só em Server Components / cookie httpOnly via BFF).
- Isolamento de papel no frontend: dupla camada (middleware + `requireRole` em cada Server Component) sem vazamento de skeleton antes da checagem.
- `.env.local` nunca foi commitado; `.env.example` não contém segredo real.
- Zero `console.log`/dado sensível logado no frontend.

---

# Bugs Encontrados

### B-SEC-1 — Chave privada de JWT commitada e usada em produção
- **Descrição:** `authz.pem` (RSA privada) está no repositório e é a mesma chave usada em produção (sem override em `application-prod.yaml`).
- **Onde:** `api/src/main/resources/authz.pem`, `SecurityConfig.java:36-40,72-77`.
- **Impacto:** qualquer pessoa com acesso ao histórico do repo pode forjar JWT válido como qualquer usuário. Compromete 100% da autenticação.
- **Prioridade:** Crítica/P0.
- **Como reproduzir:** extrair `authz.pem` do git, assinar um JWT RS256 com `email` de qualquer usuário-alvo.
- **Como corrigir:** gerar novo par de chaves fora do controle de versão (env var/secret manager), remover do classpath e do histórico do git, tratar tokens já emitidos como comprometidos.

### B-SEC-2 — Faixas de risco clínico placeholder idênticas para 8 escalas
- **Descrição:** cortes de risco (Baixo/Moderado/Alto) são os mesmos três tercis genéricos para todas as escalas, sem corte validado na literatura.
- **Onde:** `api/data/insert.sql:49-77`, `migration_2026-07-16_novas_escalas.sql:132-145`.
- **Impacto:** psicólogo recebe rótulo de risco clínico sem validade científica, apresentado como se fosse.
- **Prioridade:** Crítica.
- **Como corrigir:** inserir cortes reais por escala ou marcar `risk_label` como "preliminar/não validado" na UI até lá.

### B-PAC-1 — Tela de confirmação pós-envio quebra para todo paciente convidado — ✅ CORRIGIDO (2026-07-21)
- **Descrição:** botão "Voltar ao início" na tela final bate em rota bloqueada pelo filtro de escopo de convite, gerando 403 em loop.
- **Onde:** `remind-web/features/questionnaires/components/wizard/confirmation.tsx`; `api/.../config/InviteScopedAuthorizationFilter.java`.
- **Impacto:** 100% dos pacientes reais ficam sem saída na última tela do fluxo.
- **Prioridade:** P0.
- **Como reproduzir (antes da correção):** consumir convite, responder até o fim, clicar "Voltar ao início".
- **Correção aplicada:** `Confirmation` e o `EmptyState` de `responder/page.tsx` (mesmo padrão, mesmo botão) agora recebem/derivam `restricted`/`isInviteScoped` a partir de `session.user.questionnaireId` e escondem o botão nesse caso (mensagem "Você já pode fechar esta página." no lugar). Além disso, `middleware.ts` agora redireciona qualquer sessão com `questionnaireId` que tente acessar outra rota `/paciente/*` (inclusive `/paciente/inicio`, `/paciente/perfil` e o destino pós-`/login`) de volta para a própria página do questionário — fecha a causa raiz também para navegação manual/bookmark, não só os dois links específicos.

### B-PAC-2 — Sessão do paciente expira em 10 min, não nos 30 min pretendidos — ✅ CORRIGIDO (2026-07-21)
- **Descrição:** `NextAuth session.maxAge` é global (600s) e ignora o `expiresIn` de 1800s emitido para tokens de convite.
- **Onde:** `remind-web/lib/auth/config.ts`; `api/.../AccessTokenService.java:32`.
- **Impacto:** paciente perdia todas as respostas se demorasse mais de 10 minutos; não podia logar de novo (token de uso único).
- **Prioridade:** P0.
- **Como reproduzir (antes da correção):** consumir convite, aguardar >10 min, tentar enviar.
- **Correção aplicada:** `session.maxAge` do NextAuth elevado para 1800s (o teto do token mais longo emitido pelo backend). Isso não afrouxa o login normal de 10min: a validade real de cada sessão continua sendo `session.expiresAt` (calculado a partir do `expiresIn` retornado por cada provider), já checado em `requireSession()` e `middleware.ts` — o teto do cookie só precisava deixar de matar a sessão de convite antes da hora. Contador visual de tempo restante no wizard **não foi implementado** (melhoria de UX pendente, não bloqueante).

### B-PSI-1 — Sem validação de CPF duplicado entre pacientes
- **Onde:** `InsertPatientService.java:43-45`; `schema.sql:32`.
- **Impacto:** dois pacientes diferentes podem compartilhar CPF sem aviso.
- **Prioridade:** Alta.
- **Como corrigir:** checar `existsByCpf` no service + `UNIQUE` no banco como salvaguarda.

### B-PSI-2 — Duplicidade de e-mail por race condition (check-then-act)
- **Onde:** `InsertPatientService.java:43-45`; `schema.sql:31`.
- **Prioridade:** Média.
- **Como corrigir:** `UNIQUE` em `users.email` + tratar `DataIntegrityViolationException` como 409.

### B-DEVX-1 — Nenhum `error.tsx`/`not-found.tsx` em todo o app Next.js
- **Onde:** confirmado por busca em `remind-web/app/**`.
- **Impacto:** qualquer 500/erro de conversão cai na tela crua padrão do framework, sem marca do produto.
- **Prioridade:** Alta.
- **Como corrigir:** criar `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` reaproveitando `ErrorState`/`EmptyState` já existentes.

### B-PSI-3 — ID não numérico na URL gera 500 técnico em vez de 404
- **Onde:** `app/(app)/psicologo/pacientes/[id]/page.tsx`, `avaliacoes/[id]/page.tsx`; `GlobalExceptionHandler.java:53-69`.
- **Prioridade:** Alta.
- **Como corrigir:** validar `Number.isInteger` no frontend + `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` retornando 400 no backend.

### B-BE-1 — `GlobalExceptionHandler` vaza mensagens técnicas e nunca loga
- **Onde:** `GlobalExceptionHandler.java:53-87`.
- **Impacto:** informação de infraestrutura vazada ao cliente; zero rastreabilidade de erro em produção.
- **Prioridade:** Crítica.
- **Como corrigir:** logar `ex` no servidor, devolver mensagem genérica ao cliente para exceções não mapeadas.

### B-BE-2 — Falha de `@Valid` retorna 500 em vez de 400
- **Onde:** ausência de `@ExceptionHandler(MethodArgumentNotValidException.class)`.
- **Prioridade:** Crítica (contrato de API quebrado).
- **Como corrigir:** handler dedicado devolvendo 400 com lista de campos inválidos.

### B-PAC-3 — Tela de erro de convite sem nenhuma ação disponível
- **Onde:** `consume-invite-view.tsx:96-97`.
- **Prioridade:** Alta.
- **Como corrigir:** adicionar `onRetry` (erros de rede) e orientação/contato de suporte (erros de convite expirado/revogado/usado).

### B-PAC-4 — Server Component do wizard sem try/catch na 2ª chamada
- **Onde:** `app/(app)/paciente/questionarios/[id]/responder/page.tsx:52-56`.
- **Impacto:** paciente excluído no meio da resposta causa crash cru ao dar F5.
- **Prioridade:** Alta.
- **Como corrigir:** envolver em try/catch, tratar 404 com `notFound()`/redirecionamento amigável.

### B-PAC-5 — Nenhum `loading.tsx` nas rotas do paciente
- **Onde:** ausente em `paciente/inicio`, `paciente/perfil`, `paciente/questionarios/[id]/responder`.
- **Prioridade:** Alta (UX de alta frequência).

### B-PERF-1 — N+1 duplicado no envio de resposta de questionário
- **Onde:** `AnswerQuestionnaireValidator.java:51-66` + `AnswerQuestionnaireService.java:87-104` repetem as mesmas ~2N queries cada.
- **Prioridade:** Alta.
- **Como corrigir:** buscar todas as `Question`/`QuestionOption` de uma vez, montar mapas em memória, compartilhar entre validator e service.

### B-DEVOPS-1 — Zero CI/CD
- **Onde:** `.github/workflows` inexistente.
- **Prioridade:** Crítica, dado deploy automático em push já existente.

---

# Checklist Final

| Área | Status | Observação |
|---|---|---|
| Segurança — Autenticação | ❌ | Chave JWT commitada e reutilizada em produção é bloqueador absoluto |
| Segurança — Autorização/IDOR | ✅ | Isolamento cross-tenant confirmado correto em todos os endpoints auditados |
| Segurança — Infra (CORS/CSP/Rate limit) | ❌ | CORS `*`, sem CSP, sem rate limit em login |
| Backend — Tratamento de erro | ❌ | Vaza mensagem interna, não loga, status HTTP incorreto em validação |
| Backend — Lógica de negócio | ⚠️ | Cálculo matemático correto; faixas de risco clínico são placeholder |
| Frontend — Fluxo psicólogo | ⚠️ | Funcional, com bugs de validação e páginas de erro ausentes |
| Frontend — Fluxo paciente | ❌ | Dois bugs P0 afetando 100% dos pacientes no fluxo principal |
| UX geral | ⚠️ | Sem loading states em rotas de paciente; erros genéricos; sem página 404/500 de marca |
| Banco de dados — Integridade | ⚠️ | Faltam constraints UNIQUE (email, cpf, result 1:1) e FKs com ON DELETE explícito |
| Banco de dados — Timezone | ⚠️ | Timestamps sem timezone; risco de recorrência de bug já visto antes |
| Performance | ⚠️ | N+1 real no envio de questionário; demais listagens paginadas corretamente |
| Qualidade de código | ✅ | Código limpo, sem dead code relevante, sem console.log/TODO esquecido |
| Testes — Backend | ✅ | Cobertura real nos fluxos críticos (login, cálculo, evolução) |
| Testes — Frontend | ❌ | Praticamente inexistente na superfície autenticada |
| Deploy/DevOps | ❌ | Zero CI/CD, zero observabilidade de erro, deploy automático sem gate |
| Escalabilidade | ⚠️ | Falta de índices em FKs de alto uso; query não paginada em um endpoint |

---

# Parecer Final

## 🔴 Não deve ir para produção no estado atual

**Justificativa técnica:** existe uma vulnerabilidade que, sozinha, já seria motivo suficiente para bloquear o lançamento — a chave privada de assinatura de JWT está commitada no repositório e é a mesma usada em produção, o que permite forjar autenticação como qualquer usuário do sistema. Isso, somado a resultados clínicos exibidos com cortes de risco inventados, dois bugs que quebram o fluxo principal para 100% dos pacientes reais (tela final sem saída e perda de respostas por expiração de sessão prematura), zero observabilidade de erro em produção e zero gate de CI antes de um deploy automático, configura um conjunto de riscos concretos e não hipotéticos para dados de saúde mental de pessoas reais.

Nenhum desses itens exige redesenho de arquitetura — são correções pontuais e bem localizadas (rotacionar uma chave, ajustar um `maxAge`, esconder um botão condicionalmente, adicionar um `try/catch`, logar exceções, restringir CORS, ligar CI). O trabalho de base do produto (isolamento multi-tenant, modelagem de dados, qualidade geral do código, cobertura de teste do backend) já demonstra que a equipe sabe fazer certo — esses achados são lacunas de "fechar o cerco antes do go-live", não sinal de projeto malfeito.

**Caminho para 🟡:** resolvido o bloco de críticos listado acima (rotação da chave JWT, definição de cortes clínicos reais ou rotulagem explícita de "preliminar", logging de exceções + CORS restrito + validação HTTP correta, CI mínimo, e os dois bugs P0 do fluxo do paciente), o sistema passa a ter um risco residual administrável e pode ir a produção com acompanhamento próximo nas primeiras semanas.
