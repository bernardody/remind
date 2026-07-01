# Task List: Login com Google (Psicólogo) — Backend

**Specification**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Generated**: 2026-07-01
**Language**: spring

## Codebase Analysis Summary

- **Project Structure**: backend Spring Boot 4.0.2 (Java 21) em `api/src/main/java/br/com/remind`, organizado por camadas (`controller/`, `service/`, `domain/`, `repository/`, `config/`). Schema mantido à mão em `api/data/schema.sql` com `ddl-auto: validate`.
- **Key Patterns**: controllers REST finos + regras em `service/`; entidades JPA com Lombok; DTOs `record`/POJO com Bean Validation; JWT emitido/validado via Nimbus em `SecurityConfig`/`LoginController`; erros via `GlobalExceptionHandler`.
- **Integration Points**: `UserRepository` (`findByEmail`/`existsByEmail`), `JwtEncoder`/`JwtDecoder`, `AuthenticatedUserService`, `PsychologistRepository`; provedor externo Google (JWKS) para validar o ID token. Sem nova dependência no `pom.xml`.

## Task Index

| Task ID | Title | Technical Focus | Status | Dependencies |
|---------|-------|-----------------|--------|--------------|
| [TASK-001](tasks/TASK-001.md) | Modelo de dados: conta pendente e identidade Google | schema.sql, `User`, `UserRepository` | [x] | - |
| [TASK-002](tasks/TASK-002.md) | AccessTokenService, `LoginResponse.profileComplete`, coexistência | `AccessTokenService`, `LoginResponse`, `LoginController` | [x] | TASK-001 |
| [TASK-003](tasks/TASK-003.md) | GoogleTokenVerifier: validação do ID token | `GoogleTokenVerifier`, `application*.yaml` | [x] | - |
| [TASK-004](tasks/TASK-004.md) | Fluxo de login Google: criar/vincular/rejeitar | `GoogleLoginService/Controller/Request`, `SecurityConfig` | [x] | TASK-001, TASK-002, TASK-003 |
| [TASK-005](tasks/TASK-005.md) | Conclusão de perfil (CPF, telefone, endereço) | `PsychologistController`, `CompleteProfile*`, `AddressRepository` | [x] | TASK-001 |
| [TASK-006](tasks/TASK-006.md) | Autorização por perfil incompleto (403) | `IncompleteProfileAuthorizationFilter`, `SecurityConfig` | [x] | TASK-004, TASK-005 |
| [TASK-007](tasks/TASK-007.md) | [E2E] Testes End-to-End | suíte e2e de todos os fluxos | [x] | TASK-001..TASK-006 |
| [TASK-008](tasks/TASK-008.md) | [CLEANUP] Code Cleanup & Hygiene | todos os arquivos da feature | [x] | TASK-007 |

**Legend**:
- [E2E] = End-to-end test task (valida o workflow completo)
- [CLEANUP] = Code cleanup task (usa a skill specs-code-cleanup)

## Tasks

- [TASK-001](tasks/TASK-001.md): Modelo de dados: conta pendente e identidade Google
- [TASK-002](tasks/TASK-002.md): AccessTokenService, `LoginResponse.profileComplete` e coexistência do login por senha
- [TASK-003](tasks/TASK-003.md): GoogleTokenVerifier: validação do ID token do Google
- [TASK-004](tasks/TASK-004.md): Fluxo de login Google: criar, vincular ou rejeitar
- [TASK-005](tasks/TASK-005.md): Conclusão de perfil do psicólogo (CPF, telefone, endereço)
- [TASK-006](tasks/TASK-006.md): Autorização por perfil incompleto (403 nas demais operações)
- [TASK-007](tasks/TASK-007.md): End-to-End Testing (valida a feature inteira)
- [TASK-008](tasks/TASK-008.md): Code Cleanup & Workspace Hygiene (limpeza final)

## Dependency Flow

```
TASK-001 ─┬─> TASK-002 ─┐
          │              ├─> TASK-004 ─┐
TASK-003 ─┼──────────────┘             ├─> TASK-006 ─> TASK-007 ─> TASK-008
          └─> TASK-005 ────────────────┘
                (TASK-005 depende de TASK-001)
```

## Task Type Summary

- **Implementation Tasks** (TASK-001 a TASK-006): implementação da feature (6 tarefas)
- **E2E Test Task** (TASK-007): teste ponta a ponta do workflow completo
- **Cleanup Task** (TASK-008): qualidade final e higiene do workspace
