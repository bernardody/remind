---
id: TASK-006
title: "Autorização por perfil incompleto (403 nas demais operações)"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: [TASK-004, TASK-005]
ac-mapping: [AC-8]
imp-requirements: [REQ-013]
---

# TASK-006: Autorização por perfil incompleto (403 nas demais operações)

**Functional Description**: Enquanto uma conta de psicólogo estiver com **Perfil Incompleto**
(`profile_complete = false`), o Token de Acesso só deve autorizar a **Conclusão de Perfil** e
a **leitura do próprio perfil**; qualquer outra operação protegida deve retornar 403.

**Maps to Specification**: REQ-013 (autorização restrita enquanto o perfil está incompleto).
Cobre AC-8.

## Acceptance Criteria

- [x] Um psicólogo autenticado com `profile_complete = false` que chama um endpoint protegido diferente da conclusão/leitura do próprio perfil recebe 403. (REQ-013)
- [x] O mesmo psicólogo consegue acessar `PUT /psychologists/me/profile` (conclusão) e a leitura do próprio perfil. (REQ-013)
- [x] Contas com `profile_complete = true` não são afetadas (acesso normal aos endpoints autorizados). (REQ-013)
- [x] A verificação ocorre após a autenticação JWT e não afeta os endpoints públicos (`/login`, `/login/google`). (REQ-013)

## ⚠️ File Collision Note

- `SecurityConfig.java` também é modificado por **TASK-004** (permitAll de `/login/google`).
  Esta tarefa depende de TASK-004 e adiciona seção distinta: registro do filtro/mecanismo de
  autorização por perfil (ex.: `http.addFilterAfter(...)` ou `AuthorizationManager`). Edições
  aditivas e não sobrepostas.

## Definition of Ready (DoR)

- [x] TASK-004 (login Google + `profile_complete` populado) e TASK-005 (rota de conclusão) concluídas.
- [x] Caminho exato da rota de conclusão e da leitura do próprio perfil conhecidos.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: `SecurityConfig` usa `authorizeHttpRequests` + `oauth2ResourceServer(jwt)`, sessão `STATELESS`. `AuthenticatedUserService` obtém o usuário via claim `email` do JWT. Rejeições retornam JSON via `GlobalExceptionHandler`.
- **APIs to Integrate With**: `SecurityFilterChain`, `AuthenticatedUserService`/`UserRepository` (para ler `profile_complete`), o `JwtDecoder` já configurado.
- **Shared Components**: `User.profileComplete`.
- **Conventions**: config de segurança em `config/`; retornar 403 de forma consistente com o handler global.
- **Architecture Reference**: seção 4 (Security Constraints — endpoints sensíveis exigem autorização) de `docs/specs/architecture.md`.
- **Domain Terms**: Perfil Incompleto, Conclusão de Perfil.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/main/java/br/com/remind/config/IncompleteProfileAuthorizationFilter.java` - filtro que, para usuários autenticados com `profile_complete=false`, permite apenas conclusão/leitura do próprio perfil e bloqueia o resto com 403. *(nome sugerido; alternativa: `AuthorizationManager` dedicado)*
- `api/src/test/java/br/com/remind/config/IncompleteProfileAuthorizationIT.java` - teste de integração cobrindo bloqueio e permissão.

**Files to Modify**:
- `api/src/main/java/br/com/remind/config/SecurityConfig.java` - registrar o filtro/manager na cadeia, após a autenticação JWT (ver nota de colisão).

## Test Instructions

**1. Mandatory Integration Tests:**
   - `Autorização por perfil incompleto`:
     - [x] Psicólogo com `profile_complete=false` chamando um endpoint protegido qualquer (ex.: listar pacientes) → 403. *(REQ-013)*
     - [x] O mesmo psicólogo chamando `PUT /psychologists/me/profile` → autorizado (não 403). *(REQ-013)*
     - [x] O mesmo psicólogo lendo o próprio perfil → autorizado. *(REQ-013)*
     - [x] Psicólogo com `profile_complete=true` acessa os endpoints normalmente. *(REQ-013)*
     - [x] Endpoints públicos (`/login`, `/login/google`) permanecem acessíveis sem token. *(REQ-013 — não regredir públicos)*

**2. Edge Cases:**
   - [x] Requisição sem token continua 401 (não 403). *(distinção autenticação vs. autorização)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando.

## Definition of Done (DoD)

- [x] Mecanismo de autorização por perfil incompleto implementado e registrado.
- [x] Conclusão e leitura do próprio perfil liberadas; demais operações protegidas bloqueadas com 403.
- [x] Sem regressão em contas completas e endpoints públicos.

**Dependencies**: TASK-004, TASK-005

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-006.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `config/IncompleteProfileAuthorizationFilter.java` (`OncePerRequestFilter`: para JWT autenticado com `profile_complete=false`, libera apenas `PUT`/`GET /psychologists/me/profile`, bloqueia o resto com 403 JSON); teste `config/IncompleteProfileAuthorizationIT`.
**Modificado**: `config/SecurityConfig.java` (registra o filtro via `addFilterAfter(..., BearerTokenAuthenticationFilter.class)`; filtro instanciado no bean da chain, sem `@Component`, para evitar registro duplo no servlet).
**Testes**: `IncompleteProfileAuthorizationIT` (4) verdes — incompleto→403 em `/pacientes`, leitura do próprio perfil liberada, completo acessa normal, sem token→401 (não 403).

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
