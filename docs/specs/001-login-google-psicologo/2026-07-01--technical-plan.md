# Technical Plan: Login com Google (Psicólogo) — Backend

- **Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
- **Created**: 2026-07-01
- **Status**: Draft
- **Scope**: Backend (ReMind API — Spring Boot)

---

## Technology Stack

Herdado do projeto existente (`api/pom.xml`). Nenhuma dependência nova é necessária —
o objetivo é reutilizar o que já está no classpath.

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Linguagem | Java | 21 | Já definido no projeto (`java.version`) |
| Framework | Spring Boot | 4.0.2 | Parent POM já em uso |
| Web | spring-boot-starter-webmvc | (BOM 4.0.2) | Padrão dos controllers existentes |
| Segurança | spring-boot-starter-security | (BOM 4.0.2) | `SecurityConfig` já configurado |
| JWT (validação/emissão) | spring-security-oauth2-jose (Nimbus) | (BOM 4.0.2) | Já no classpath via resource/authorization server; usado em `SecurityConfig`/`LoginController` |
| Persistência | spring-boot-starter-data-jpa | (BOM 4.0.2) | Repositórios JPA já existentes |
| Banco | PostgreSQL | driver `org.postgresql` (runtime) | Banco atual (`application.yaml`) |
| Validação | spring-boot-starter-validation | (BOM 4.0.2) | `@Valid` já usado em `LoginRequest` |
| Boilerplate | Lombok | (BOM 4.0.2) | Padrão das entidades/DTOs |
| Testes | spring-boot-starter-*-test | (BOM 4.0.2) | Stack de teste já presente |

### Forbidden Technologies

| Technology | Reason Not Used | Alternative Chosen |
|-----------|-----------------|--------------------|
| `spring-security-oauth2-client` | Traria o fluxo redirect/callback server-side; decisão foi frontend enviar o ID token (DEC-002) | Validação do ID token via `NimbusJwtDecoder` |
| `google-api-client` / `google-oauth-client` | Dependência externa adicional para algo que o Nimbus já resolve (ID token é JWT) | `NimbusJwtDecoder.withJwkSetUri(...)` |
| Sessão HTTP (stateful) | Backend é `STATELESS` (ver `SecurityConfig`) | JWT stateless já em uso |
| Flyway/Liquibase | Projeto usa `schema.sql` + `ddl-auto: validate` | Editar `data/schema.sql` manualmente |

---

## Architecture Decisions

### AD-001: Validação do ID token do Google via NimbusJwtDecoder

**Context**: O frontend envia o ID token do Google (DEC-002). O ID token do Google é
um JWT assinado (RS256) cujas chaves públicas são publicadas em um JWKS. O backend
precisa validar assinatura, emissor, audiência e expiração.

**Decision**: Criar um `JwtDecoder` dedicado ao Google com
`NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")`,
adicionando validadores de `issuer` (`https://accounts.google.com` / `accounts.google.com`)
e `audience` (== `google.client-id`). Reutiliza a lib Nimbus já no classpath.

**Alternatives Considered**:
1. `google-api-client` (`GoogleIdTokenVerifier`) — **Pros**: API específica, cache de
   certificados pronto / **Cons**: nova dependência para algo que o Nimbus já faz.
2. `spring-security-oauth2-client` (fluxo redirect) — **Pros**: fluxo OAuth gerenciado
   / **Cons**: contraria DEC-002 (backend faria redirect/callback), mais superfície.
3. Validação manual da assinatura — **Pros**: zero dependência / **Cons**: reinventar
   verificação de JWT/JWKS, propenso a erro de segurança.

**Consequences**:
- **Positive**: Sem dependência nova; consistência com o padrão de JWT já existente.
- **Negative**: Precisamos configurar explicitamente os validadores de issuer/audience.
- **Risks**: Config incorreta de audience/issuer aceitaria tokens indevidos → mitigado
  por teste unitário dos validadores (ver Risk R-02).

**Applied In**: Phase 2.

---

### AD-002: Modelo de dados — conta pendente e identidade Google

**Context**: `users` exige `password`, `cpf`, `phone` NOT NULL, e `psychologists`
exige `Address` NOT NULL. Uma conta criada via Google só tem nome+email (DEC-003).

**Decision**:
- Tornar `users.password`, `users.cpf`, `users.phone` **nullable**.
- Adicionar `users.google_sub VARCHAR(255)` (nullable, único quando presente) e
  `users.profile_complete BOOLEAN NOT NULL DEFAULT FALSE`.
- A linha `psychologists` (+ `addresses`) só é criada na **conclusão de perfil**, não
  no primeiro login Google.

**Alternatives Considered**:
1. Tabela separada `google_identities(user_id, google_sub)` — **Pros**: normaliza,
   suporta múltiplos provedores / **Cons**: over-engineering; escopo é só Google.
2. Criar `psychologists`/`addresses` já no primeiro login com valores placeholder —
   **Pros**: mantém NOT NULL / **Cons**: dados falsos no banco, difícil distinguir pendente.

**Consequences**:
- **Positive**: Fluxo pendente simples; um único ponto de verdade em `users`.
- **Negative**: Colunas antes obrigatórias ficam nullable; validações de completude
  passam para a camada de aplicação.
- **Risks**: Código existente que assume `password != null` pode quebrar → mitigado em AD-003.

**Applied In**: Phase 1.

---

### AD-003: Coexistência com o login por senha existente

**Context**: `LoginController` compara senha com BCrypt e assume `password` presente.
Contas só-Google não têm senha (REQ-011).

**Decision**: Em `LoginController`, tratar `user.getPassword() == null` **antes** do
`passwordEncoder.matches(...)`, rejeitando com mensagem "Esta conta utiliza login do
Google". Extrair a emissão do JWT da aplicação para um serviço reutilizável
(`AccessTokenService`) consumido tanto por `/login` quanto por `/login/google`.

**Alternatives Considered**:
1. Duplicar a lógica de emissão de JWT no novo controller — **Pros**: rápido /
   **Cons**: duplicação, divergência de claims/expiração.
2. Deixar `passwordEncoder.matches(null, ...)` estourar — **Pros**: nenhum /
   **Cons**: erro 500 em vez de 401 com mensagem clara.

**Consequences**:
- **Positive**: Uma única fonte de emissão de token; mensagens de erro coerentes.
- **Negative**: Refactor leve no `LoginController`.
- **Risks**: Regressão no login por senha → mitigado por testes do fluxo existente.

**Applied In**: Phase 1 (guard) + Phase 2 (serviço de token).

---

### AD-004: Contrato dos endpoints e resposta com perfil incompleto

**Context**: O resultado do login precisa sinalizar se o perfil deve ser completado
(REQ-008), mantendo o formato do token atual (REQ-007).

**Decision**:
- `POST /login/google` com corpo `{ "idToken": "..." }`, em `permitAll` (ajustar
  `SecurityConfig`, hoje só `POST /login` é público).
- Estender `LoginResponse` para `LoginResponse(accessToken, expiresIn, type, profileComplete)`.
- Endpoint autenticado `PUT /psychologists/me/profile` (ou `POST /psychologists/profile`)
  recebendo CPF, telefone e endereço → cria `psychologists`+`addresses`, seta
  `profile_complete = true`.

**Alternatives Considered**:
1. Novo DTO de resposta separado só para Google — **Pros**: isola / **Cons**: dois
   formatos de login para o frontend manter.
2. Retornar `profileComplete` só via claim no JWT — **Pros**: nada novo no corpo /
   **Cons**: frontend teria que decodificar o JWT para rotear.

**Consequences**:
- **Positive**: Frontend usa o mesmo `LoginResponse` e roteia por `profileComplete`.
- **Negative**: Alterar um record compartilhado exige ajustar o `/login` atual.
- **Risks**: Baixo.

**Applied In**: Phase 2 e Phase 3.

---

## Implementation Phases

### Phase 1: Fundação (modelo de dados e coexistência)
**Goal**: Preparar `users` para contas pendentes/só-Google sem quebrar o login atual.

**Entry Criteria**:
- [x] Spec funcional aprovada.

**Milestones**:
- [ ] `data/schema.sql`: `password`/`cpf`/`phone` nullable; add `google_sub`, `profile_complete`.
- [ ] Entidade `User`: remover `@NotBlank`/`@NotNull` desses campos; add `googleSub`, `profileComplete`.
- [ ] `UserRepository.findByGoogleSub(...)` (além de `findByEmail`).
- [ ] Guard em `LoginController` para `password == null` (AD-003).
- [ ] Ajustar `insert.sql` se necessário (dados semeados continuam válidos).

**Dependencies**: nenhuma.

**Risks**: `ddl-auto: validate` falha se schema e entidade divergirem → aplicar
`schema.sql` e entidade juntos.

---

### Phase 2: Autenticação via Google
**Goal**: Validar o ID token e autenticar/criar/vincular a conta de psicólogo.

**Entry Criteria**:
- [ ] Phase 1 concluída.

**Milestones**:
- [ ] Config `google.client-id` em `application.yaml`/`application-prod.yaml`.
- [ ] `GoogleTokenVerifier` com `NimbusJwtDecoder` + validadores issuer/audience (AD-001).
- [ ] `AccessTokenService` extraído da lógica de `LoginController` (AD-003).
- [ ] `GoogleLoginService`: valida `email_verified`; busca por email; ramifica
      vincular (psicólogo) / rejeitar (paciente) / criar pendente (REQ-004/005/006).
- [ ] `GoogleLoginController` (`POST /login/google`) + `GoogleLoginRequest { idToken }`.
- [ ] `SecurityConfig`: `POST /login/google` em `permitAll`.
- [ ] `LoginResponse` estendido com `profileComplete`.

**Dependencies**: Phase 1.

**Risks**: ver R-01, R-02.

---

### Phase 3: Conclusão de perfil
**Goal**: Permitir que a conta pendente vire completa.

**Entry Criteria**:
- [ ] Phase 2 concluída.

**Milestones**:
- [ ] `CompleteProfileRequest` (CPF, telefone, endereço) com validação.
- [ ] `CompleteProfileService`: cria `Address` + `Psychologist`, seta `profile_complete=true`.
- [ ] Endpoint autenticado `PUT /psychologists/me/profile`.
- [ ] Reutilizar `AuthenticatedUserService` para obter o usuário logado.

**Dependencies**: Phase 2.

**Risks**: conclusão parcial/concorrente → operação transacional única.

---

### Phase 4: Testes e verificação
**Goal**: Cobrir os fluxos e caminhos de erro da spec.

**Milestones**:
- [ ] Testes de `GoogleTokenVerifier` (issuer/audience/expiração inválidos rejeitados).
- [ ] Testes de `GoogleLoginService`: novo→pendente, psicólogo→vincula, paciente→403,
      `email_verified=false`→rejeita.
- [ ] Teste do guard de login por senha em conta só-Google.
- [ ] Teste de conclusão de perfil.

**Dependencies**: Phases 1–3.

---

## Performance Requirements

Projeto acadêmico (TCC), carga baixa; metas conservadoras e mensuráveis.

| Métrica | Alvo | Método de medição |
|---------|------|-------------------|
| `POST /login/google` (p95) | < 400 ms (excluindo 1º fetch do JWKS) | Log de tempo/APM local |
| Fetch/validação JWKS | cacheado pelo `NimbusJwtDecoder` (sem fetch por request) | Teste de integração |
| Queries por request de login | ≤ 3 (buscar usuário, inserir/atualizar) | Log de SQL Hibernate |
| Conclusão de perfil (p95) | < 400 ms | Log de tempo |

**Nota**: `NimbusJwtDecoder` faz cache das chaves do JWKS; não há chamada externa por
requisição após o primeiro carregamento. Sem metas de throughput/escala relevantes
para o contexto.

---

## Risk Assessment

| ID | Risk | Likelihood | Impact | Overall | Mitigation | Detection |
|----|------|------------|--------|---------|------------|-----------|
| R-01 | Indisponibilidade do JWKS do Google no 1º carregamento | LOW | MEDIUM | LOW | Cache do decoder; erro 503 claro | Falha na validação / log |
| R-02 | Validação frouxa de audience/issuer aceita token de outro app | MEDIUM | HIGH | HIGH | Validadores explícitos + teste unitário | Teste com token de audience errada |
| R-03 | Regressão no login por senha ao tornar campos nullable / refactor | MEDIUM | HIGH | HIGH | `AccessTokenService` + testes do fluxo atual | Testes de `/login` |
| R-04 | Colisão de email entre conta pendente e cadastro por senha | LOW | MEDIUM | LOW | `email` continua chave de busca; vínculo por email verificado | Teste de vínculo |
| R-05 | `ddl-auto: validate` quebra por divergência schema/entidade | MEDIUM | MEDIUM | MEDIUM | Alterar `schema.sql` e entidade na mesma fase | App não sobe |

### Risk Response Protocol — R-02 (validação de token)

1. **Detect**: teste automatizado envia token com `aud` diferente do `google.client-id`.
2. **Triage**: falha de build bloqueia merge.
3. **Mitigate**: garantir `JwtValidators` de audience e issuer registrados no decoder.
4. **Resolve**: teste permanente cobrindo audience/issuer/expiração inválidos.

---

## Project Structure

Segue a convenção por camadas já existente em `api/src/main/java/br/com/remind/`.

```
br/com/remind/
├── config/
│   └── SecurityConfig.java              # + rota /login/google em permitAll
├── controller/
│   ├── LoginController.java             # + guard password == null
│   ├── GoogleLoginController.java       # NOVO — POST /login/google
│   ├── PsychologistController.java      # NOVO — PUT /psychologists/me/profile
│   ├── request/
│   │   ├── login/GoogleLoginRequest.java        # NOVO — { idToken }
│   │   └── psychologist/CompleteProfileRequest.java  # NOVO
│   └── response/login/LoginResponse.java # + campo profileComplete
├── service/
│   ├── login/AccessTokenService.java     # NOVO — emissão de JWT (extraído)
│   ├── login/GoogleTokenVerifier.java    # NOVO — valida ID token (Nimbus)
│   ├── login/GoogleLoginService.java     # NOVO — criar/vincular/rejeitar
│   └── psychologist/CompleteProfileService.java # NOVO
├── domain/
│   └── User.java                         # + googleSub, profileComplete; campos nullable
└── repository/
    └── UserRepository.java               # + findByGoogleSub

api/src/main/resources/application.yaml   # + google.client-id
api/data/schema.sql                       # colunas nullable + google_sub, profile_complete
```

### Structure Rules

1. Regras de negócio ficam em `service/`; controllers só orquestram (padrão atual).
2. Um DTO por arquivo em `request/`/`response/` (padrão atual).
3. Emissão de JWT centralizada em `AccessTokenService` — não duplicar em controllers.
4. Sem nova dependência no `pom.xml` para este feature.

---

## Compliance Checklist

- [x] Todas as dependências reutilizam o BOM Spring Boot 4.0.2 (sem versões soltas).
- [x] Todas as decisões (AD-001..004) têm rationale e alternativas.
- [x] Todos os riscos têm mitigação e detecção.
- [x] Metas de performance mensuráveis e adequadas ao contexto.
- [x] Estrutura segue a convenção por camadas existente.

---

## Technical Plan Summary

**Feature**: Login com Google (Psicólogo) — Backend
**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Created**: 2026-07-01
**Status**: Draft

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AD-001 | Validar ID token com `NimbusJwtDecoder` (JWKS Google) | Reusa lib existente; sem dependência nova |
| AD-002 | Conta pendente em `users` (nullable + `google_sub`/`profile_complete`) | Simplicidade; único ponto de verdade |
| AD-003 | `AccessTokenService` + guard `password == null` | Sem duplicar emissão; coexiste com login por senha |
| AD-004 | `POST /login/google` + `LoginResponse.profileComplete` | Mesmo contrato de token; frontend roteia por flag |

### Implementation Phases

| Phase | Goal | Dependencies |
|-------|------|--------------|
| Phase 1 | Fundação (modelo de dados + coexistência) | None |
| Phase 2 | Autenticação via Google | Phase 1 |
| Phase 3 | Conclusão de perfil | Phase 2 |
| Phase 4 | Testes e verificação | Phases 1–3 |

### Top Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| R-02 Validação frouxa de audience/issuer | MEDIUM | HIGH | Validadores explícitos + teste |
| R-03 Regressão no login por senha | MEDIUM | HIGH | `AccessTokenService` + testes |

---

## Next Steps

1. `/developer-kit-specs:specs.spec-to-tasks --lang=spring docs/specs/001-login-google-psicologo/`
2. Executar as tarefas na ordem das fases (1 → 4).
3. Após implementar: `/developer-kit-specs:specs.sync docs/specs/001-login-google-psicologo/`
