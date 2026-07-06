---
id: TASK-002
title: "AccessTokenService, LoginResponse.profileComplete e coexistência do login por senha"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: [TASK-001]
ac-mapping: [AC-6, AC-7, AC-10]
imp-requirements: [REQ-007, REQ-008, REQ-011]
---

# TASK-002: AccessTokenService, LoginResponse.profileComplete e coexistência do login por senha

**Functional Description**: Centralizar a emissão do **Token de Acesso da Aplicação** em um
serviço reutilizável (para o login por senha e, depois, o login Google emitirem tokens
idênticos), estender `LoginResponse` com `profileComplete` e tratar o login por senha em
conta só-Google (sem senha) rejeitando com mensagem clara.

**Maps to Specification**: REQ-007 (mesmo formato de token), REQ-008 (indicação de perfil
incompleto no resultado), REQ-011 (login por senha em conta só-Google rejeitado — [SEF]).
Cobre AC-6, AC-7 e o guard de AC-10.

## Acceptance Criteria

- [x] Existe um `AccessTokenService` que emite o JWT da aplicação com os mesmos claims/expiração usados hoje em `LoginController` (`issuer=tcc`, `subject=name`, `email`, `expiresIn=600`). (REQ-007)
- [x] `LoginResponse` passa a incluir `profileComplete`; o `POST /login` existente retorna `profileComplete = true` para contas por senha (perfis completos). (REQ-008)
- [x] `LoginController` usa o `AccessTokenService` em vez de emitir o JWT inline (sem duplicação).
- [x] Um login por senha em conta cujo `password` é `NULL` (só-Google) é rejeitado com 401 e mensagem indicando o uso do login do Google, **antes** de qualquer comparação de senha. (REQ-011)

## Definition of Ready (DoR)

- [x] TASK-001 concluída (`password` nullable disponível na entidade).
- [x] Entendimento do fluxo atual de `LoginController` e do `JwtEncoder` já configurado em `SecurityConfig`.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: emissão de JWT em `controller/LoginController.java` (usar `JwtEncoder`, `JwtClaimsSet.builder()...issuer("tcc").subject(name).claim("email", ...)`, `expiresIn = 600`). `LoginResponse` é um `record`.
- **APIs to Integrate With**: `JwtEncoder` (bean em `SecurityConfig`), `PasswordEncoder`, `SearchUserService.searchByEmail`.
- **Shared Components**: `LoginResponse` é compartilhado — será consumido também pelo login Google (TASK-004). Manter aditivo.
- **Conventions**: serviços em `service/login/`; um DTO por arquivo; injeção por construtor.
- **Architecture Reference**: 3.5 (emissão de JWT centralizada — não duplicar) de `docs/specs/architecture.md`.
- **Domain Terms**: Token de Acesso da Aplicação, Perfil Incompleto.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/main/java/br/com/remind/service/login/AccessTokenService.java` - emissão centralizada do JWT da aplicação a partir de um `User`.
- `api/src/test/java/br/com/remind/service/login/AccessTokenServiceTest.java` - testa claims/expiração do token emitido.
- `api/src/test/java/br/com/remind/controller/LoginControllerTest.java` - testa login por senha OK e o guard de conta só-Google.

**Files to Modify**:
- `api/src/main/java/br/com/remind/controller/response/login/LoginResponse.java` - adicionar `boolean profileComplete`.
- `api/src/main/java/br/com/remind/controller/LoginController.java` - usar `AccessTokenService`; guard `password == null`; retornar `profileComplete`.

## Test Instructions

**1. Mandatory Unit Tests:**
   - `AccessTokenService`:
     - [x] Emite um token com `issuer=tcc`, `subject` = nome do usuário, claim `email` e `expiresIn = 600`. *(REQ-007)*
   - `LoginController`:
     - [x] Login por senha correta retorna 200, token e `profileComplete = true`. *(REQ-007, REQ-008)*
     - [x] Login por senha em conta com `password == null` é rejeitado com 401 e mensagem de login do Google, sem chamar `passwordEncoder.matches`. *(REQ-011)*
     - [x] Usuário/senha incorretos continuam retornando 401 (sem regressão). *(regressão)*

**2. Mandatory Integration Tests:**
   - `Fluxo /login`:
     - [x] `POST /login` com credenciais válidas persiste nada e retorna o corpo com `profileComplete`. *(REQ-008)*

**3. Edge Cases:**
   - [x] `password == null` não deve gerar erro 500 (NPE em `matches`). *(REQ-011)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando; cobertura de `AccessTokenService` >= 80%.

## Definition of Done (DoD)

- [x] `AccessTokenService` criado e consumido por `LoginController`.
- [x] `LoginResponse.profileComplete` disponível para o login Google (TASK-004).
- [x] Guard de conta só-Google implementado e testado.
- [x] Nenhuma regressão no login por senha.

**Dependencies**: TASK-001

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-002.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `service/login/AccessTokenService.java` (emissão central do JWT, `EXPIRES_IN=600`, claims `iss=tcc`/`sub=name`/`email`); testes `AccessTokenServiceTest`, `LoginControllerTest`.
**Modificado**: `LoginResponse` (+`boolean profileComplete`); `LoginController` (usa `AccessTokenService`, guard `password==null` → 401 "login do Google" antes de comparar, bad credentials via `ResponseStatusException(401)` em vez de `BadCredentialsException`).
**Nota**: `BadCredentialsException` caía no handler de `RuntimeException` (500); troca para `ResponseStatusException(401)` corrige o status e alinha com a convenção do projeto.
**Testes**: `AccessTokenServiceTest` (1) + `LoginControllerTest` (4) verdes.

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
