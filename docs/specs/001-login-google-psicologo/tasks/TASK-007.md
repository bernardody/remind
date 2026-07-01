---
id: TASK-007
title: "Testes End-to-End: Login com Google (Psicólogo)"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: [TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006]
ac-mapping: [AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11]
imp-requirements: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014]
---

# TASK-007: Testes End-to-End: Login com Google (Psicólogo)

**Functional Description**: Validar, de ponta a ponta, todos os fluxos da funcionalidade a
partir da perspectiva do consumidor da API (frontend), com o `GoogleTokenVerifier` operando
sobre tokens de teste (chaves controladas) para não depender da rede do Google. Verifica os
critérios `[IMP]`, o `[SEF]` (REQ-011) e registra o checkpoint do `[EXT]` (tela de consentimento).

**Maps to Specification**: todos os critérios de aceite (AC-1..AC-11).

## Acceptance Criteria

- [x] **Fluxo 1 (conta nova)**: `POST /login/google` com token válido de email inexistente → 200, `profileComplete=false`, conta pendente persistida. (AC-1, AC-6)
- [x] **Fluxo 4 (conclusão)**: com o token retornado, `PUT /psychologists/me/profile` com dados válidos → conta completa; novo login reflete `profileComplete=true`. (AC-5)
- [x] **Fluxo 3 (vínculo)**: token válido de psicólogo existente → `google_sub` vinculado, dados preservados. (AC-2, AC-9)
- [x] **Fluxo 2 (recorrente)**: segundo login Google do mesmo usuário reconhece a conta sem duplicar. (REQ-012)
- [x] **Rejeições**: paciente → 403; token inválido/expirado/`email_verified=false` → 401 sem criar/vincular. (AC-3, AC-4)
- [x] **Formato do token**: o token do login Google tem o mesmo formato/claims do login por senha. (AC-7)
- [x] **Autorização por perfil incompleto**: conta pendente é bloqueada (403) em endpoint protegido não relacionado; liberada na conclusão/leitura do próprio perfil. (AC-8)
- [x] **[SEF]** Login por senha em conta só-Google → falha com mensagem de login do Google. (AC-10 / REQ-011)

## Verificações suplementares (não bloqueantes)

- [x] **[EXT] Checkpoint**: a tela de consentimento/autorização do Google é responsabilidade do frontend (fora do backend). Registrar como verificado manualmente. (AC-11)

## Definition of Ready (DoR)

- [x] TASK-001 a TASK-006 concluídas.
- [x] Estratégia para emitir ID tokens de teste assinados por chave controlada, com decoder de teste apontado a um JWKS local (evita chamadas reais ao Google).

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: `@SpringBootTest` + MockMvc/`TestRestTemplate`; base de teste em `api/src/test/java/br/com/remind/`.
- **APIs to Integrate With**: `POST /login`, `POST /login/google`, `PUT /psychologists/me/profile`, mais um endpoint protegido existente (ex.: `GET /pacientes`) para validar o 403 de perfil incompleto.
- **Shared Components**: `GoogleTokenVerifier` (configurar para JWKS de teste), `AccessTokenService`, `UserRepository`.
- **Conventions**: teste de integração com banco (PostgreSQL local ou Testcontainers se disponível); dados semeados via `insert.sql`.
- **Domain Terms**: todos do `ontology.md`.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/test/java/br/com/remind/LoginGoogleE2ETest.java` - percorre os fluxos 1–4, rejeições, formato de token, autorização por perfil incompleto e o guard de conta só-Google.
- (se necessário) utilitário de teste para gerar ID tokens de teste e um `JwtDecoder` de teste.

## Test Instructions

**End-to-End (happy path + erros):**
   - [x] Conta nova → pendente → conclusão → completa → acesso liberado. *(AC-1, AC-5, AC-6, AC-8)*
   - [x] Vínculo de psicólogo existente sem sobrescrever dados. *(AC-2, AC-9)*
   - [x] Login recorrente reconhece a mesma conta. *(REQ-012)*
   - [x] Paciente rejeitado (403); token inválido/`email_verified=false` rejeitado (401), sem escrita. *(AC-3, AC-4)*
   - [x] Token do login Google idêntico em formato ao do login por senha. *(AC-7)*
   - [x] Perfil incompleto: 403 em endpoint não relacionado; ok na conclusão/leitura do próprio perfil. *(AC-8)*
   - [x] Login por senha em conta só-Google → mensagem de login do Google. *(AC-10 / REQ-011)*

**Test Acceptance Criteria**:
   - [x] Todos os fluxos acima cobertos e passando; persistência verificada ao fim de cada fluxo.

## Definition of Done (DoD)

- [x] Suite e2e cobre todos os `[IMP]`, o `[SEF]` e registra o checkpoint `[EXT]`.
- [x] Testes passam de forma determinística sem depender da rede do Google.
- [x] Evidências dos fluxos documentadas.

**Dependencies**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-007.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `LoginGoogleE2ETest.java` (`@SpringBootTest`+`@AutoConfigureMockMvc`, `GoogleTokenVerifier` mockado via `@MockitoBean` para determinismo sem rede).
**Cobertura E2E (5 testes)**: fluxo conta nova→pendente→conclusão→completa + bloqueio 403 em endpoint não relacionado e liberação da leitura/conclusão do próprio perfil; vínculo de psicólogo existente preservando dados; login recorrente sem duplicar; rejeições paciente→403 / inválido→401 / `email_verified=false`→401 sem escrita; paridade de formato do token (senha × Google); guard de login por senha em conta só-Google.
**Infra de teste**: `src/test/resources/application.yaml` com H2 (`NON_KEYWORDS=VALUE`, `ddl-auto=create-drop`) e `google.client-id` de teste — permite rodar todo o contexto sem Postgres/rede.
**[EXT] AC-11**: tela de consentimento do Google é responsabilidade do frontend — verificado manualmente (fora do backend).

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
