---
id: TASK-008
title: "Code Cleanup & Workspace Hygiene: Login com Google"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
completed_date: 2026-07-01
reviewed_date: 2026-07-01
dependencies: [TASK-007]
ac-mapping: []
imp-requirements: []
---

# TASK-008: Code Cleanup & Workspace Hygiene: Login com Google

**Functional Description**: Limpeza final usando a skill `specs-code-cleanup` para garantir
código pronto para produção e workspace limpo após a implementação e os testes e2e.

**Maps to Specification**: N/A (tarefa de higiene; não implementa critérios funcionais).

## Acceptance Criteria

- [x] Nenhum log de debug remanescente (`System.out.println`, `printStackTrace`, loggers de depuração temporários) nos arquivos criados/modificados.
- [x] Nenhum comentário de debug/TODO temporário; imports não usados removidos.
- [x] Código formatado conforme o padrão do projeto; linhas > 120 chars ajustadas.
- [x] Sem código morto óbvio (métodos privados não usados, código inalcançável) introduzido pela feature.
- [x] Nenhum arquivo temporário criado durante o desenvolvimento permanece no repositório.
- [x] Build e testes finais passam (`mvn test` / `./mvnw test`).

## Definition of Ready (DoR)

- [x] TASK-007 concluída (e2e passando).
- [x] Skill `specs-code-cleanup` disponível.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: padrão por camadas de `br.com.remind`; convenções de nomes e DTOs.
- **Conventions**: sem nova dependência no `pom.xml`; manter `schema.sql` e entidades em sincronia.
- **Architecture Reference**: seção 5 (AI Guardrails) de `docs/specs/architecture.md`.

## Implementation Details

**Escopo de arquivos**: todos os criados/modificados em TASK-001..TASK-007
(`domain/User.java`, `repository/UserRepository.java`, `repository/AddressRepository.java`,
`service/login/*`, `service/psychologist/*`, `controller/*`, `controller/request|response/*`,
`config/SecurityConfig.java`, `config/IncompleteProfileAuthorizationFilter.java`,
`resources/application*.yaml`, `data/schema.sql`, `data/insert.sql`, e os testes).

**CRÍTICO**: esta tarefa DEVE usar a skill `specs-code-cleanup`. Consultar a documentação da
skill para o procedimento exato.

## Test Instructions

- [x] Rodar a suíte de testes completa após a limpeza — tudo deve continuar passando.
- [x] Rodar o linter/formatter e confirmar ausência de violações introduzidas pela feature.

**Test Acceptance Criteria**:
   - [x] Build limpo e todos os testes passando após a limpeza.

## Definition of Done (DoD)

- [x] Skill `specs-code-cleanup` executada sobre o escopo da feature.
- [x] Sem logs/comentários de debug, imports não usados ou código morto introduzidos.
- [x] Build e testes finais verdes; workspace limpo.

**Dependencies**: TASK-007

**Implementation Command**:
/developer-kit-specs:specs-code-cleanup --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-008.md"

---

## Cleanup Summary (2026-07-01)

- Varredura por `System.out`/`printStackTrace`/`println`/`console.log`/TODO-FIXME-DEBUG temporários nos arquivos da feature: **nenhuma ocorrência**.
- Imports revisados (removidos `BadCredentialsException`/`JwtEncoder`/`Optional` não usados em `LoginController`; `Customizer` não usado em `SecurityConfig`).
- Sem dependências novas além de `com.h2database:h2` (test scope, DEC-006). Sem arquivos temporários no repositório.
- **Build/testes finais**: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
