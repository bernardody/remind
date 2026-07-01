---
id: TASK-004
title: "Fluxo de login Google: criar, vincular ou rejeitar"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: [TASK-001, TASK-002, TASK-003]
ac-mapping: [AC-1, AC-2, AC-3, AC-4, AC-6, AC-9]
imp-requirements: [REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-012, REQ-014]
---

# TASK-004: Fluxo de login Google: criar, vincular ou rejeitar

**Functional Description**: Expor `POST /login/google` que recebe o ID token, valida
`email_verified`, localiza a conta pelo email e ramifica: **cria** Conta Pendente (email
inexistente), **vincula** a Identidade Google a psicólogo existente (preservando dados) ou
**rejeita** (paciente / token inválido). Em caso de sucesso emite o Token de Acesso da
Aplicação com a indicação de perfil incompleto.

**Maps to Specification**: REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-012,
REQ-014 (e negativos REQ-NR002/003/004). Cobre AC-1, AC-2, AC-3, AC-4, AC-6, AC-9.

## Acceptance Criteria

- [x] `POST /login/google` com `{ idToken }` válido de **email inexistente** cria conta de psicólogo pendente (`type=PSYCHOLOGIST`, `profile_complete=false`, `google_sub` setado, sem senha/CPF/telefone) e retorna token com `profileComplete = false`. (REQ-006, REQ-012)
- [x] ID token válido de **psicólogo existente** vincula `google_sub` à conta **sem sobrescrever** nome/demais dados e retorna token com `profileComplete` conforme o estado da conta. (REQ-004, REQ-014)
- [x] ID token válido cujo email é de **paciente** é rejeitado com 403; nenhuma conta é criada ou vinculada. (REQ-005, REQ-NR003)
- [x] ID token inválido/expirado **ou** `email_verified = false` é rejeitado (401); nenhuma conta é criada ou vinculada. (REQ-003, REQ-NR002)
- [x] O ID token do Google não é persistido nem usado como token de sessão. (REQ-NR004)
- [x] `POST /login/google` é público (`permitAll`) no `SecurityConfig`.

## ⚠️ External Dependency Risk

- **Depends on**: `GoogleTokenVerifier` (TASK-003) e `AccessTokenService`/`LoginResponse` (TASK-002).
- **Status**: Verified — criados pelas tarefas dependentes.
- **Mitigation**: implementar após TASK-002 e TASK-003; validar assinaturas dos serviços antes de consumir.

## Acceptance / File Collision Note

- `SecurityConfig.java` também é modificado por **TASK-006** (registro do filtro de perfil
  incompleto). Aqui a alteração é **apenas** adicionar `POST /login/google` em `permitAll`.
  TASK-006 depende desta tarefa e edita seção distinta (registro de filtro) — edições
  aditivas e não sobrepostas.

## Definition of Ready (DoR)

- [x] TASK-001, TASK-002 e TASK-003 concluídas.
- [x] `UserRepository.findByEmail`/`findByGoogleSub`, `AccessTokenService`, `GoogleTokenVerifier` disponíveis.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: controllers REST com `@RestController`/`@RequestMapping` e `@Valid @RequestBody`; serviços em `service/login/`; rejeições via `ResponseStatusException` (tratadas por `GlobalExceptionHandler`). `SearchUserService.searchByEmail` já existe.
- **APIs to Integrate With**: `GoogleTokenVerifier` (validação), `AccessTokenService` (emissão), `UserRepository` (`findByEmail`, `findByGoogleSub`, `save`), `LoginResponse` (com `profileComplete`).
- **Shared Components**: `LoginResponse`, `User`, `UserType`.
- **Conventions**: um DTO por arquivo em `request/login/`; regras de negócio no service, controller só orquestra; `permitAll` para rotas públicas no `SecurityConfig`.
- **Architecture Reference**: seção 3.7 (Bearer JWT, erro JSON) e AD-004 do technical plan.
- **Domain Terms**: Conta Pendente, Vínculo de Conta, Identidade Google, Token de Acesso da Aplicação.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/main/java/br/com/remind/service/login/GoogleLoginService.java` - orquestra validação (`GoogleTokenVerifier`), checa `email_verified`, ramifica criar/vincular/rejeitar e emite token via `AccessTokenService`.
- `api/src/main/java/br/com/remind/controller/GoogleLoginController.java` - `POST /login/google`.
- `api/src/main/java/br/com/remind/controller/request/login/GoogleLoginRequest.java` - `{ idToken }` com validação.
- `api/src/test/java/br/com/remind/service/login/GoogleLoginServiceTest.java` - testes das ramificações.
- `api/src/test/java/br/com/remind/controller/GoogleLoginControllerIT.java` - teste de integração do endpoint (verifier mockado).

**Files to Modify**:
- `api/src/main/java/br/com/remind/config/SecurityConfig.java` - adicionar `POST /login/google` em `permitAll` (ver nota de colisão).

## Test Instructions

**1. Mandatory Unit Tests:**
   - `GoogleLoginService` (com `GoogleTokenVerifier` mockado):
     - [x] Email inexistente → cria `User` pendente (`profile_complete=false`, `google_sub` setado, sem senha/CPF/telefone) e retorna `profileComplete=false`. *(REQ-006, REQ-012)*
     - [x] Email de psicólogo existente → seta `google_sub` sem alterar `name`/demais campos; retorna token. *(REQ-004, REQ-014)*
     - [x] Email de paciente → lança rejeição 403; `userRepository.save` não é chamado. *(REQ-005, REQ-NR003)*
     - [x] `email_verified = false` → rejeitado; nenhuma conta criada/vinculada. *(REQ-003, REQ-NR002)*
     - [x] Token inválido (verifier lança) → rejeitado; nenhuma escrita no banco. *(REQ-003)*

**2. Mandatory Integration Tests:**
   - `POST /login/google`:
     - [x] Token válido de email novo → 200, corpo com `accessToken`, `type=PSYCHOLOGIST`, `profileComplete=false`; usuário pendente persistido. *(REQ-006, REQ-008)*
     - [x] Token de paciente → 403 e estado do banco inalterado. *(REQ-005)*
     - [x] Corpo sem `idToken` → 400. *(validação de entrada)*
     - [x] Endpoint acessível sem autenticação (permitAll). *(config)*

**3. Edge Cases:**
   - [x] Segundo login Google do mesmo usuário reconhece a conta (por email/`google_sub`) sem duplicar. *(REQ-012)*
   - [x] Vínculo em conta existente não sobrescreve dados. *(REQ-014)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando; cobertura de `GoogleLoginService` >= 80%.

## Definition of Done (DoD)

- [x] `POST /login/google` implementado com as três ramificações e emissão de token.
- [x] `email_verified` e token inválido rejeitados sem escrita no banco.
- [x] `permitAll` configurado; ID token não persistido.
- [x] Comportamento documentado para TASK-006 (o filtro de perfil incompleto usará `profile_complete`).

**Dependencies**: TASK-001, TASK-002, TASK-003

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-004.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `service/login/GoogleLoginService.java` (verifica token, checa `email_verified`, ramifica criar/vincular/rejeitar, emite token); `controller/GoogleLoginController.java` (`POST /login/google`); `controller/request/login/GoogleLoginRequest.java`; testes `GoogleLoginServiceTest`, `controller/GoogleLoginControllerIT`.
**Modificado**: `config/SecurityConfig.java` (`POST /login/google` em `permitAll`).
**Testes**: `GoogleLoginServiceTest` (6) + `GoogleLoginControllerIT` (3) verdes; cobertos criar pendente, vincular sem sobrescrever, paciente→403, `email_verified=false`→401, token inválido→401, recorrente sem duplicar.

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
