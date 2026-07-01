# Task Review Report: TASK-002

**Task**: TASK-002 — AccessTokenService, LoginResponse.profileComplete e coexistência do login por senha
**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Reviewed**: 2026-07-01
**Reviewer**: AI Code Reviewer
**Review Status**: passed

---

## Review Summary

| Aspect | Status | Details |
|--------|--------|---------|
| Acceptance Criteria | ✅ | 4/4 met |
| Definition of Done | ✅ | 4/4 met |
| Code Quality | ✅ | Emissão de JWT centralizada; sem duplicação; guard antes de comparar senha |
| Spec Compliance | ✅ | REQ-007, REQ-008, REQ-011 atendidos |
| Architectural Alignment | ✅ | `LoginResponse` estendido de forma aditiva (Shared) |

**Overall Status**: **passed**

---

## Acceptance Criteria & DoD Results

### Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-6 (token) | `AccessTokenService` emite JWT com `iss=tcc`, `sub=name`, `email`, `expiresIn=600` | ✅ Met | `AccessTokenService`; `AccessTokenServiceTest` |
| AC-7 | `LoginResponse.profileComplete`; `/login` retorna `true` p/ contas por senha | ✅ Met | `LoginResponse`; `LoginController`; `LoginControllerTest.login_withValidPassword...` |
| — | `LoginController` usa `AccessTokenService` (sem JWT inline) | ✅ Met | `LoginController` refatorado |
| AC-10 (guard) | Login por senha em conta `password==null` → 401 antes de comparar | ✅ Met | `LoginController` (guard); `LoginControllerTest.login_onGoogleOnlyAccount...` (verify never matches) |

### Definition of Done

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | `AccessTokenService` consumido por `LoginController` | ✅ Met | código |
| 2 | `LoginResponse.profileComplete` disponível p/ TASK-004 | ✅ Met | usado por `GoogleLoginService` |
| 3 | Guard só-Google testado | ✅ Met | `LoginControllerTest` |
| 4 | Sem regressão no login por senha | ✅ Met | `LoginControllerTest` (OK / senha errada / email inexistente) |

### Definition of Ready

- [x] TASK-001 concluída  - [x] Fluxo `/login` e `JwtEncoder` entendidos  - [x] Arquivos acessíveis  - [x] Tooling ok

---

## Code Review Findings

| # | Severity | File | Line(s) | Category | Description | Recommendation |
|---|----------|------|---------|----------|-------------|----------------|
| 1 | 🔵 Info | `controller/LoginController.java` | guard | Maintainability | Troca de `BadCredentialsException` por `ResponseStatusException(401)` muda o status de 500→401 (correção) | Documentado em DEC-007 |

No code review findings críticos.

---

## Spec Compliance & Architectural Alignment

### Spec Fidelity Check

| AC-ID | Taxonomy | Task Claims | Implementation Matches | Notes |
|-------|----------|-------------|----------------------|-------|
| AC-6 | [IMP] | Yes | ✅ | indicação de perfil no resultado |
| AC-7 | [IMP] | Yes | ✅ | mesmo formato de token |
| AC-10 | [SEF] | Yes (guard) | ✅ | efeito colateral verificado tb no e2e (TASK-007) |

### Cross-Boundary Adherence

All changes within expected bounded context (Autenticação).

### Decision Log Check

| DEC-ID | Relevant to Task | Honored in Implementation |
|--------|-----------------|--------------------------|
| DEC-007 | Yes | ✅ Yes |

### Traceability Matrix Update

- [x] Test Files: `AccessTokenServiceTest`, `LoginControllerTest`
- [x] Code Files: `AccessTokenService`, `LoginResponse`, `LoginController`
- [x] Status → Implemented (REQ-007, REQ-008, REQ-011)

---

## Required Fixes

No required fixes.

---

## Next Steps

| If Status | Action |
|-----------|--------|
| `passed` | Prosseguir |
