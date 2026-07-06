# Traceability Matrix: Login com Google (Psicólogo)

**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Generated**: 2026-07-01
**Last Updated**: 2026-07-01

## Coverage Summary

- **Requirements**: 14 funcionais (REQ-001..REQ-014) + 4 negativos (REQ-NR001..004)
- **[I] Implementável**: 12 requisitos cobertos por tarefas — 12/12 (100%)
- **[S] Side-Effect**: 1 (REQ-011) — verificado no e2e (TASK-007) — 1/1 (100%)
- **[E] External**: 1 (tela de consentimento) — checkpoint no e2e — 1/1 (100%)
- **With Tests**: unit + integração + e2e (29 testes, todos verdes)
- **Implemented**: 12/12 [I] + 1/1 [S] + checkpoint [E] — **100% (reviewed 2026-07-01)**

## Coverage Type Legend

| Type | Meaning | Task Generated? | Verified In |
|------|---------|-----------------|-------------|
| `[I]` Implementable | Requer novo código | SIM — tarefa(s) dedicada(s) | Unit + Integration |
| `[S]` Side-Effect | Consequência natural de `[I]` | NÃO — verificação e2e | E2E (TASK-007) |
| `[E]` External | Verificado externamente | NÃO — checkpoint e2e | E2E (TASK-007) |

## Matrix

| REQ ID | Type | Requisito (resumo) | Task(s) | E2E Checkpoint? | Test Files | Code Files | Status |
|--------|------|--------------------|---------|-----------------|------------|------------|--------|
| REQ-001 | [I] | Operação backend recebe ID token e autentica | TASK-004 | — | `GoogleLoginServiceTest`, `GoogleLoginControllerIT`, `LoginGoogleE2ETest` | `GoogleLoginController`, `GoogleLoginRequest`, `GoogleLoginService` | Implemented |
| REQ-002 | [I] | Validar assinatura/issuer/aud/exp + email_verified | TASK-003, TASK-004 | — | `GoogleTokenVerifierTest` | `GoogleTokenVerifier`, `GoogleClaims` | Implemented |
| REQ-003 | [I] | Token inválido/expirado/email não verif → rejeita, nada criado | TASK-003, TASK-004 | — | `GoogleTokenVerifierTest`, `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleTokenVerifier`, `GoogleLoginService` | Implemented |
| REQ-004 | [I] | Email de psicólogo existente → vincula + token | TASK-004 | — | `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleLoginService` | Implemented |
| REQ-005 | [I] | Email de paciente → rejeita | TASK-004 | — | `GoogleLoginServiceTest`, `GoogleLoginControllerIT`, `LoginGoogleE2ETest` | `GoogleLoginService` | Implemented |
| REQ-006 | [I] | Email inexistente → cria conta pendente + token | TASK-004 (base: TASK-001) | — | `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleLoginService`, `User` | Implemented |
| REQ-007 | [I] | Mesmo formato de token do login por senha | TASK-002 | — | `AccessTokenServiceTest`, `LoginGoogleE2ETest` (paridade) | `AccessTokenService` | Implemented |
| REQ-008 | [I] | Resultado indica se perfil precisa completar | TASK-002, TASK-004 | — | `LoginControllerTest`, `GoogleLoginServiceTest` | `LoginResponse`, `LoginController`, `GoogleLoginService` | Implemented |
| REQ-009 | [I] | Conta pode existir sem senha/CPF/telefone/endereço | TASK-001 | — | `UserRepositoryTest` | `User`, `schema.sql` | Implemented |
| REQ-010 | [I] | Enviar CPF/telefone/endereço → conclui perfil | TASK-005 | — | `CompleteProfileServiceTest`, `PsychologistControllerIT` | `PsychologistController`, `CompleteProfileService`, `AddressRepository` | Implemented |
| REQ-011 | [S] | Login por senha em conta só-Google → rejeita c/ msg | TASK-002 (guard) | YES | `LoginControllerTest`, `LoginGoogleE2ETest` | `LoginController` | Implemented |
| REQ-012 | [I] | Armazenar associação da identidade Google | TASK-001, TASK-004 | — | `UserRepositoryTest`, `GoogleLoginServiceTest` | `User`, `UserRepository`, `GoogleLoginService` | Implemented |
| REQ-013 | [I] | Perfil incompleto → só conclusão/leitura, resto 403 | TASK-006 | — | `IncompleteProfileAuthorizationIT`, `LoginGoogleE2ETest` | `IncompleteProfileAuthorizationFilter`, `SecurityConfig` | Implemented |
| REQ-014 | [I] | Vínculo preserva dados existentes | TASK-004 | — | `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleLoginService` | Implemented |
| REQ-NR001 | [I] | Não confiar em claim sem verificar assinatura | TASK-003 | — | `GoogleTokenVerifierTest` | `GoogleTokenVerifier` | Implemented |
| REQ-NR002 | [I] | Não criar/vincular se email_verified=false | TASK-004 | — | `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleLoginService` | Implemented |
| REQ-NR003 | [I] | Não permitir paciente autenticar via Google | TASK-004 | — | `GoogleLoginServiceTest`, `LoginGoogleE2ETest` | `GoogleLoginService` | Implemented |
| REQ-NR004 | [I] | Não armazenar/usar ID token como sessão | TASK-004 | — | `LoginGoogleE2ETest` | `GoogleLoginService` (token só em memória) | Implemented |
| — (EXT) | [E] | Tela de consentimento exibida pelo Google (frontend) | — (manual) | YES | checkpoint `LoginGoogleE2ETest` | frontend | Verified (manual) |

## Critérios de Aceite → Tarefas

| AC | Tipo | Task(s) |
|----|------|---------|
| AC-1 (cria pendente) | [IMP] | TASK-001, TASK-004 |
| AC-2 (vincula existente) | [IMP] | TASK-004 |
| AC-3 (paciente negado) | [IMP] | TASK-004 |
| AC-4 (token inválido negado) | [IMP] | TASK-003, TASK-004 |
| AC-5 (conclusão de perfil) | [IMP] | TASK-005 |
| AC-6 (indica perfil incompleto) | [IMP] | TASK-002, TASK-004 |
| AC-7 (mesmo formato de token) | [IMP] | TASK-002 |
| AC-8 (403 perfil incompleto) | [IMP] | TASK-006 |
| AC-9 (vínculo preserva dados) | [IMP] | TASK-004 |
| AC-10 (login senha em conta só-Google) | [SEF] | TASK-002 + e2e TASK-007 |
| AC-11 (consentimento no frontend) | [EXT] | checkpoint e2e TASK-007 |
