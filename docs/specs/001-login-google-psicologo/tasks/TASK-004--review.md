# Task Review Report: TASK-004

**Task**: TASK-004 — Fluxo de login Google: criar, vincular ou rejeitar
**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Reviewed**: 2026-07-01
**Reviewer**: AI Code Reviewer
**Review Status**: passed

---

## Review Summary

| Aspect | Status | Details |
|--------|--------|---------|
| Acceptance Criteria | ✅ | 6/6 met |
| Definition of Done | ✅ | 4/4 met |
| Code Quality | ✅ | Controller fino; regras no service; rejeições via `ResponseStatusException` |
| Spec Compliance | ✅ | REQ-001/003/004/005/006/008/012/014 + NR002/003/004 |
| Architectural Alignment | ✅ | `SecurityConfig` alterado só no `permitAll` (nota de colisão com TASK-006 respeitada) |

**Overall Status**: **passed**

---

## Acceptance Criteria & DoD Results

### Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-1 | Email inexistente → cria pendente (`profile_complete=false`, `google_sub`, sem senha/CPF/telefone), token `profileComplete=false` | ✅ Met | `GoogleLoginService.createPendingPsychologist`; `GoogleLoginServiceTest.login_newEmail...`; `GoogleLoginControllerIT`; E2E fluxo 1 |
| AC-2 | Psicólogo existente → vincula `google_sub` sem sobrescrever | ✅ Met | `linkGoogleIdentity`; `...linksGoogleSubWithoutOverwritingData`; E2E fluxo 3 |
| AC-3 | Paciente → 403, sem criar/vincular | ✅ Met | `login_patientEmail...403`; `GoogleLoginControllerIT.patientEmail...`; E2E |
| AC-4 | Token inválido/expirado ou `email_verified=false` → 401, sem escrita | ✅ Met | `login_emailNotVerified...`, `login_invalidToken...`; E2E rejeições |
| AC-6 | Token não persistido nem usado como sessão | ✅ Met | ID token só em memória em `verify`; `LoginResponse` usa token da app |
| AC-9 | `POST /login/google` público | ✅ Met | `SecurityConfig` permitAll; `GoogleLoginControllerIT` acessível sem auth |

### Definition of Done

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | 3 ramificações + emissão de token | ✅ Met | `GoogleLoginService` |
| 2 | `email_verified`/token inválido sem escrita | ✅ Met | testes verify never save |
| 3 | permitAll; ID token não persistido | ✅ Met | config + REQ-NR004 |
| 4 | Comportamento documentado p/ TASK-006 | ✅ Met | summary + `profile_complete` populado |

### Definition of Ready

- [x] TASK-001/002/003 concluídas  - [x] `findByEmail`/`findByGoogleSub`/`AccessTokenService`/`GoogleTokenVerifier` disponíveis

---

## Code Review Findings

| # | Severity | File | Line(s) | Category | Description | Recommendation |
|---|----------|------|---------|----------|-------------|----------------|
| 1 | 🔵 Info | `service/login/GoogleLoginService.java` | linkGoogleIdentity | Maintainability | Se `google_sub` existente diferir do `sub` do token, mantém o antigo (não atualiza) | Comportamento seguro; aceitável |
| 2 | 🔵 Info | `service/login/GoogleLoginService.java` | createPendingPsychologist | Edge | Sem constraint única de `email` no schema; corrida teórica de duplo cadastro | Aceitável p/ o contexto (carga baixa) |

---

## Spec Compliance & Architectural Alignment

### Spec Fidelity Check

| AC-ID | Taxonomy | Task Claims | Implementation Matches | Notes |
|-------|----------|-------------|----------------------|-------|
| AC-1/2/3/4/6/9 | [IMP] | Yes | ✅ | todos cobertos por unit+IT+E2E |

### Cross-Boundary Adherence

| File | Expected Context | Actual Context | Status |
|------|-----------------|---------------|--------|
| `config/SecurityConfig.java` | Autenticação | Autenticação | ✅ OK (edição aditiva `permitAll`; colisão com TASK-006 em seção distinta) |

### Decision Log Check

| DEC-ID | Relevant to Task | Honored in Implementation |
|--------|-----------------|--------------------------|
| DEC-002/003/004/005 | Yes | ✅ Yes (idToken enviado pelo front; conta pendente; vínculo se email_verified; sem confirmação) |

### Traceability Matrix Update

- [x] Test Files: `GoogleLoginServiceTest`, `GoogleLoginControllerIT`, `LoginGoogleE2ETest`
- [x] Code Files: `GoogleLoginService`, `GoogleLoginController`, `GoogleLoginRequest`, `SecurityConfig`
- [x] Status → Implemented (REQ-001/003/004/005/006/008/012/014, NR002/003/004)

---

## Required Fixes

No required fixes.

---

## Next Steps

| If Status | Action |
|-----------|--------|
| `passed` | Prosseguir |
