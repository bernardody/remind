---
id: TASK-001
title: "Modelo de dados: conta pendente e identidade Google"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: []
ac-mapping: [AC-1, AC-9]
imp-requirements: [REQ-009, REQ-012]
---

# TASK-001: Modelo de dados: conta pendente e identidade Google

**Functional Description**: Preparar a tabela/entidade `users` para suportar uma **Conta
Pendente** criada via Google (sem senha, CPF e telefone) e o vínculo de uma **Identidade
Google**, sem quebrar o login por senha existente. Base para todos os fluxos da spec.

**Maps to Specification**: REQ-009 (conta sem senha/CPF/telefone/endereço até a conclusão),
REQ-012 (armazenar associação da identidade Google). Habilita AC-1 (criação de conta
pendente) e AC-9 (vínculo preserva dados).

## Acceptance Criteria

- [x] As colunas `password`, `cpf` e `phone` da tabela `users` passam a aceitar `NULL`. (REQ-009)
- [x] A tabela `users` possui `google_sub` (VARCHAR, nullable, único quando presente) e `profile_complete` (BOOLEAN NOT NULL, default `FALSE`). (REQ-012, REQ-008)
- [x] A entidade `User` reflete o schema: `password`/`cpf`/`phone` sem `@NotBlank`; campos `googleSub` e `profileComplete` adicionados; a aplicação sobe com `ddl-auto: validate`.
- [x] `UserRepository` expõe `findByGoogleSub(String googleSub)` além dos métodos existentes.
- [x] Os dados semeados (`insert.sql`) continuam válidos (contas por senha com `profile_complete = TRUE`, `google_sub = NULL`).

## Definition of Ready (DoR)

- [ ] Sem tarefas prerequisitas.
- [ ] Entendimento de que `schema.sql` e a entidade `User` devem mudar juntos (`ddl-auto: validate`).
- [ ] Acesso a `api/data/schema.sql`, `api/data/insert.sql`, `domain/User.java`, `repository/UserRepository.java`.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: entidades JPA com Lombok (`@Getter/@Setter/@Builder`), `@Table`, `@Id @GeneratedValue(IDENTITY)` — ver `domain/User.java`. Repositórios como `interface ... extends JpaRepository<User, Long>` com métodos derivados (`findByEmail`, `existsByEmail`).
- **APIs to Integrate With**: `UserRepository` (já usado por `SearchUserService`, `AuthenticatedUserService`).
- **Shared Components**: `User` é o Shared Kernel (usado por psychologists/patients).
- **Conventions**: schema mantido à mão em `api/data/schema.sql`; sem Flyway/Liquibase; `ddl-auto: validate`.
- **Architecture Reference**: seção 3.2 (Data Architecture) e 3.5 (schema e entidade em sincronia) de `docs/specs/architecture.md`.
- **Domain Terms**: Conta Pendente, Identidade Google, Perfil Incompleto (`docs/specs/ontology.md`).

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/test/java/br/com/remind/repository/UserRepositoryTest.java` - testa `findByGoogleSub` (encontra por google_sub, retorna vazio quando ausente) usando slice de JPA.

**Files to Modify**:
- `api/data/schema.sql` - `users.password`/`cpf`/`phone` sem `NOT NULL`; adicionar `google_sub VARCHAR(255)` (único quando não nulo) e `profile_complete BOOLEAN NOT NULL DEFAULT FALSE`.
- `api/src/main/java/br/com/remind/domain/User.java` - remover `@NotBlank` de `password`/`cpf`/`phone`; adicionar `googleSub` e `profileComplete`.
- `api/src/main/java/br/com/remind/repository/UserRepository.java` - adicionar `Optional<User> findByGoogleSub(String googleSub)`.
- `api/data/insert.sql` - garantir `profile_complete = TRUE` para as contas semeadas (ajustar INSERT de `users` se necessário).

## Test Instructions

Descreve **o que** testar, não como implementar.

**1. Mandatory Unit/Slice Tests:**
   - `UserRepository` (slice `@DataJpaTest`):
     - [x] `findByGoogleSub` retorna a conta quando existe uma com aquele `google_sub`. *(REQ-012)*
     - [x] `findByGoogleSub` retorna `Optional.empty()` quando não há correspondência. *(REQ-012)*
     - [x] Persistir um `User` com `password`/`cpf`/`phone` nulos e `profile_complete = false` funciona (conta pendente). *(REQ-009)*

**2. Mandatory Integration Tests:**
   - `Boot da aplicação`:
     - [x] A aplicação inicia com `ddl-auto: validate` após as alterações (schema e entidade coerentes). *(consistência de schema — coberto por `RemindApplicationTests.contextLoads` contra Postgres; colunas geradas por Hibernate conferem com `schema.sql`)*

**3. Edge Cases:**
   - [x] Dois usuários com `google_sub = NULL` coexistem (restrição de unicidade não dispara para nulos). *(REQ-012)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando. *(4 testes, `Tests run: 4, Failures: 0, Errors: 0`)*

## Definition of Done (DoD)

- [x] Schema, entidade e repositório alterados e coerentes (`ddl-auto: validate` passa).
- [x] `findByGoogleSub` disponível e testado.
- [x] Contas semeadas permanecem válidas.
- [x] Alterações documentadas para as tarefas dependentes (TASK-002, TASK-004, TASK-005).

**Dependencies**: None

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-001.md"

---

## Implementation Summary (2026-07-01)

**Files Modified**:
- `api/data/schema.sql` — `users.cpf`/`phone`/`password` agora nullable; adicionadas `google_sub VARCHAR(255) UNIQUE` (nullable) e `profile_complete BOOLEAN NOT NULL DEFAULT FALSE`.
- `api/src/main/java/br/com/remind/domain/User.java` — removidos `@NotBlank` de `cpf`/`phone`/`password`; adicionados `googleSub` (`@Column(unique = true)`) e `profileComplete` (`@NotNull @Builder.Default = false`).
- `api/src/main/java/br/com/remind/repository/UserRepository.java` — adicionado `Optional<User> findByGoogleSub(String googleSub)`.
- `api/src/main/java/br/com/remind/service/patient/InsertPatientService.java` — cadastro por senha agora seta `profileComplete(true)` (evita violação de `NOT NULL` na nova coluna; conta com senha nasce completa).
- `api/data/insert.sql` — INSERT de `users` passa a incluir `profile_complete = true`; `google_sub` fica `NULL` (default).
- `api/pom.xml` — adicionada dependência `com.h2database:h2` em escopo `test` para habilitar o slice `@DataJpaTest`.

**Files Created**:
- `api/src/test/java/br/com/remind/repository/UserRepositoryTest.java` — 4 testes de slice (`findByGoogleSub` presente/ausente, conta pendente com credenciais nulas, coexistência de múltiplos `google_sub = NULL`).

**Testing**:
- `mvn test -Dtest=UserRepositoryTest` → `Tests run: 4, Failures: 0, Errors: 0` (H2 em memória, schema gerado das entidades).
- Coerência entidade↔`schema.sql`: o INSERT gerado pelo Hibernate cobre exatamente as colunas de `users` (incl. `google_sub`, `profile_complete`).

**Decisões**:
- H2 (test scope) escolhido para o slice de repositório por ausência de banco de teste no projeto — registrado como DEC-006 em `decision-log.md`.

**Notas para tarefas dependentes**:
- TASK-002/004/005: `User.profileComplete` tem default `false` via `@Builder.Default`; ao criar conta pendente via Google, deixar `cpf`/`phone`/`password` nulos. Ao concluir perfil, setar `profileComplete(true)`.
- `google_sub` é único quando presente; use `userRepository.findByGoogleSub(...)` para reconhecer logins subsequentes.

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
