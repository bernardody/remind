---
id: TASK-003
title: "GoogleTokenVerifier: validação do ID token do Google"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: []
ac-mapping: [AC-4]
imp-requirements: [REQ-002, REQ-003]
---

# TASK-003: GoogleTokenVerifier: validação do ID token do Google

**Functional Description**: Criar o componente que valida a autenticidade do **ID Token**
do Google — assinatura (via JWKS público do Google), emissor, audiência (== `google.client-id`)
e expiração — reutilizando a lib Nimbus já no classpath. Tokens inválidos/expirados são
rejeitados antes de qualquer confiança em seus claims.

**Maps to Specification**: REQ-002 (validar assinatura, emissor, audiência, expiração),
REQ-003 (rejeitar token inválido/expirado), REQ-NR001 (não confiar em claim sem verificar
assinatura). Cobre a parte de validação de assinatura/claims de AC-4.

## ⚠️ External Dependency Risk

- **Depends on**: JWKS público do Google (`https://www.googleapis.com/oauth2/v3/certs`).
- **Status**: Verified — endpoint público e estável do Google; sem interface interna a implementar.
- **Mitigation**: `NimbusJwtDecoder` faz cache das chaves; indisponibilidade no 1º fetch gera erro claro (Risk R-01 do technical plan). Testes usam tokens/chaves de teste, não a rede.

## Acceptance Criteria

- [x] Existe um verificador que expõe uma operação para validar um ID token do Google e retornar os claims confiáveis (`sub`, `email`, `email_verified`, `name`). (REQ-002)
- [x] A validação usa `NimbusJwtDecoder` configurado com o JWKS do Google e validadores explícitos de `issuer` (`https://accounts.google.com` e `accounts.google.com`) e `audience` (== `google.client-id`). (REQ-002, REQ-NR001)
- [x] Token com assinatura inválida, `issuer` incorreto, `audience` diferente de `google.client-id` ou expirado é rejeitado (erro), sem retornar claims. (REQ-003)
- [x] A audiência esperada é lida da propriedade `google.client-id` (configurável por ambiente).

## Definition of Ready (DoR)

- [x] Entendimento de que o ID token do Google é um JWT RS256 validável pelo Nimbus (ver `brainstorming-notes.md`).
- [x] Acesso a `application.yaml` / `application-prod.yaml`.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: uso do Nimbus em `config/SecurityConfig.java` (`NimbusJwtDecoder`, `NimbusJwtEncoder`). Propriedades via `@Value`. Sem nova dependência no `pom.xml`.
- **APIs to Integrate With**: `NimbusJwtDecoder.withJwkSetUri(...)`, `OAuth2TokenValidator`/`JwtValidators` (ver 3.8 de `architecture.md`).
- **Shared Components**: será consumido por `GoogleLoginService` (TASK-004).
- **Conventions**: componente em `service/login/`; injeção por construtor.
- **Architecture Reference**: 3.8 Library Verification (APIs Nimbus aprovadas); AD-001 do technical plan.
- **Domain Terms**: ID Token, Identidade Google.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/main/java/br/com/remind/service/login/GoogleTokenVerifier.java` - valida o ID token e devolve os claims confiáveis; configura decoder + validadores de issuer/audience.
- `api/src/test/java/br/com/remind/service/login/GoogleTokenVerifierTest.java` - testa rejeição por audience/issuer/expiração inválidos e aceitação de token válido (com chaves/decoder de teste).

**Files to Modify**:
- `api/src/main/resources/application.yaml` - adicionar `google.client-id`.
- `api/src/main/resources/application-prod.yaml` - adicionar `google.client-id` (valor por ambiente).

## Test Instructions

**1. Mandatory Unit Tests:**
   - `GoogleTokenVerifier`:
     - [x] Token válido (issuer e audience corretos, assinatura válida, não expirado) → retorna claims esperados (`sub`, `email`, `email_verified`, `name`). *(REQ-002)*
     - [x] Token com `audience` diferente de `google.client-id` → rejeitado. *(REQ-002, Risk R-02)*
     - [x] Token com `issuer` inválido → rejeitado. *(REQ-002)*
     - [x] Token expirado → rejeitado. *(REQ-003)*
     - [x] Token com assinatura inválida → rejeitado, sem expor claims. *(REQ-003, REQ-NR001)*

**2. Edge Cases:**
   - [x] Token malformado / string vazia → rejeitado com erro tratável (não 500 genérico). *(REQ-003)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando; validadores de issuer/audience cobertos (Risk R-02).

## Definition of Done (DoD)

- [x] Verificador criado, configurável por `google.client-id`, com validadores explícitos.
- [x] Tokens inválidos rejeitados sem vazar claims.
- [x] Propriedade `google.client-id` documentada nos dois `application*.yaml`.

**Dependencies**: None

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-003.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `service/login/GoogleTokenVerifier.java` (NimbusJwtDecoder via JWKS do Google + validadores explícitos de expiração/emissor/audiência; construtor `@Autowired(@Value google.client-id)` e construtor de teste recebendo `JwtDecoder`); `service/login/GoogleClaims.java`; teste `GoogleTokenVerifierTest` (chaves RSA locais).
**Modificado**: `application.yaml`/`application-prod.yaml` (+`google.client-id`, via `GOOGLE_CLIENT_ID`).
**Testes**: `GoogleTokenVerifierTest` (6) verdes — audiência/emissor/expiração/assinatura inválidas e token em branco rejeitados.

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
