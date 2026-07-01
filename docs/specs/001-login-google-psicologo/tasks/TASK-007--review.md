# Task Review Report: TASK-007

**Task**: TASK-007 — Testes End-to-End: Login com Google (Psicólogo)
**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Reviewed**: 2026-07-01
**Reviewer**: AI Code Reviewer
**Review Status**: passed

---

## Review Summary

| Aspect | Status | Details |
|--------|--------|---------|
| Acceptance Criteria | ✅ | 8/8 (+ checkpoint [EXT]) |
| Definition of Done | ✅ | 3/3 met |
| Code Quality | ✅ | E2E determinístico via `@MockitoBean` no verifier; sem rede |
| Spec Compliance | ✅ | Todos os AC-1..AC-11 cobertos/registrados |
| Architectural Alignment | ✅ | Perfil H2 de teste isolado em `src/test/resources` |

**Overall Status**: **passed**

---

## Acceptance Criteria & DoD Results

### Acceptance Criteria (E2E)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| Fluxo 1 (nova) | conta nova → 200, `profileComplete=false`, pendente persistida | ✅ Met | `flow1and4_newAccount_pending...` |
| Fluxo 4 (conclusão) | conclui perfil; novo login `profileComplete=true` | ✅ Met | mesmo teste (PUT + 2º login) |
| Fluxo 3 (vínculo) | psicólogo existente → `google_sub` vinculado, dados preservados | ✅ Met | `flow3_existingPsychologist...` |
| Fluxo 2 (recorrente) | 2º login reconhece sem duplicar | ✅ Met | `countByEmail == 1` |
| Rejeições | paciente 403; inválido/`email_verified=false` 401 sem escrita | ✅ Met | `rejections_patient403_invalid401_unverified401...` |
| Formato do token (AC-7) | token Google == formato do login por senha | ✅ Met | `ac7_googleAndPasswordTokens_haveSameFormat` |
| Autorização (AC-8) | pendente 403 em endpoint não relacionado; liberado na conclusão/leitura | ✅ Met | fluxo 1 (GET /pacientes 403; GET /me/profile 200) |
| [SEF] AC-10 | login por senha em conta só-Google → mensagem de Google | ✅ Met | `ac10_passwordLogin_onGoogleOnlyAccount...` |

### Verificações suplementares

| # | Item | Status | Evidence |
|---|------|--------|----------|
| [EXT] AC-11 | tela de consentimento (frontend) | ✅ Registrado (manual) | fora do backend; documentado no summary |

### Definition of Done

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Suíte cobre [IMP]+[SEF]+checkpoint [EXT] | ✅ Met | `LoginGoogleE2ETest` (5 métodos) |
| 2 | Determinístico, sem rede do Google | ✅ Met | `@MockitoBean GoogleTokenVerifier` + H2 |
| 3 | Evidências documentadas | ✅ Met | summary TASK-007 |

### Definition of Ready

- [x] TASK-001..006 concluídas  - [x] Estratégia de token de teste (verifier mockado + H2)

---

## Code Review Findings

| # | Severity | File | Line(s) | Category | Description | Recommendation |
|---|----------|------|---------|----------|-------------|----------------|
| 1 | 🔵 Info | `src/test/resources/application.yaml` | H2 | Convention | `NON_KEYWORDS=VALUE` contorna `value` reservado no H2 (coluna pré-existente `question_options.value`) | Documentado em DEC-008 |
| 2 | 🔵 Info | `LoginGoogleE2ETest.java` | extractToken | Maintainability | Extração de token via regex (suficiente); poderia usar JsonPath | OK |

---

## Spec Compliance & Architectural Alignment

### Spec Fidelity Check

| AC-ID | Taxonomy | Task Claims | Implementation Matches | Notes |
|-------|----------|-------------|----------------------|-------|
| AC-1..AC-9 | [IMP] | Yes | ✅ | verificados ponta a ponta |
| AC-10 | [SEF] | Yes | ✅ | verificado no e2e |
| AC-11 | [EXT] | Yes | ✅ (checkpoint) | responsabilidade do frontend |

### Cross-Boundary Adherence

Somente arquivos de teste + config de teste. All within test scope.

### Decision Log Check

| DEC-ID | Relevant to Task | Honored in Implementation |
|--------|-----------------|--------------------------|
| DEC-008, DEC-009 | Yes | ✅ Yes |

### Traceability Matrix Update

- [x] Test Files: `LoginGoogleE2ETest`
- [x] Status → Implemented (verificação e2e de todos os REQ)

---

## Required Fixes

No required fixes.

> **Nota de ambiente**: a suíte roda em H2. Recomenda-se um boot único contra Postgres real
> (`ddl-auto: validate`) antes do merge para confirmar paridade com `schema.sql` em produção.

---

## Next Steps

| If Status | Action |
|-----------|--------|
| `passed` | Prosseguir para TASK-008 (concluída) |
