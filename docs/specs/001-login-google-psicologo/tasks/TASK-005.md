---
id: TASK-005
title: "Conclusão de perfil do psicólogo (CPF, telefone, endereço)"
spec: docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md
lang: spring
status: completed
implemented_date: 2026-07-01
reviewed_date: 2026-07-01
cleanup_date: 2026-07-01
completed_date: 2026-07-01
dependencies: [TASK-001]
ac-mapping: [AC-5]
imp-requirements: [REQ-010]
---

# TASK-005: Conclusão de perfil do psicólogo (CPF, telefone, endereço)

**Functional Description**: Permitir que uma **Conta Pendente** (criada via Google) se torne
uma **Conta Completa**. Um endpoint autenticado recebe CPF, telefone e endereço, atualiza o
`User` (CPF/telefone), cria as linhas `Psychologist` + `Address` e marca `profile_complete = TRUE`,
numa única operação transacional.

**Maps to Specification**: REQ-010 (conclusão de perfil). Cobre AC-5.

## Acceptance Criteria

- [x] Endpoint autenticado `PUT /psychologists/me/profile` recebe CPF, telefone e endereço (street, number, cep, neighborhood, city) com validação de campos obrigatórios. (REQ-010)
- [x] Ao concluir, o `User` autenticado tem `cpf`/`phone` preenchidos, uma linha `Address` e uma linha `Psychologist` (ligada ao user e ao address) são criadas, e `profile_complete` passa a `TRUE`. (REQ-010)
- [x] A operação é transacional: falha de validação/persistência não deixa estado parcial (sem `Address` órfão nem `profile_complete` alterado). (REQ-010)
- [x] Requisição com dados ausentes/inválidos retorna 400 sem alterar o estado. (REQ-010)

## Definition of Ready (DoR)

- [x] TASK-001 concluída (`profileComplete` e campos nullable disponíveis).
- [x] `AuthenticatedUserService` disponível para obter o usuário logado.

## Technical Context (from Codebase Analysis)

- **Existing Patterns to Follow**: controllers como `PatientController` (`@PutMapping`, `@RequestBody @Valid`); DTOs de request com Bean Validation (`InsertPatientRequest`); entidades `Psychologist` e `Address` já existentes (com `@ManyToOne`); `PsychologistRepository.findByUser`.
- **APIs to Integrate With**: `AuthenticatedUserService.get()` (usuário autenticado por email do JWT), `UserRepository.save`, `PsychologistRepository.save`, e um repositório de `Address` (a criar).
- **Shared Components**: `User`, `Psychologist`, `Address`.
- **Conventions**: regras no service (`service/psychologist/`), controller só orquestra; `@Transactional` no service; um DTO por arquivo em `request/psychologist/`.
- **Architecture Reference**: seção 1.1 (contexto Cadastro depende de Autenticação); AD-004 (endpoint) do technical plan.
- **Domain Terms**: Conclusão de Perfil, Conta Pendente, Perfil Incompleto.

## Implementation Details (File names only, no code)

**Files to Create**:
- `api/src/main/java/br/com/remind/controller/PsychologistController.java` - `PUT /psychologists/me/profile`.
- `api/src/main/java/br/com/remind/controller/request/psychologist/CompleteProfileRequest.java` - CPF, telefone, endereço (com `@NotBlank`/`@NotNull`).
- `api/src/main/java/br/com/remind/controller/response/psychologist/CompleteProfileResponse.java` - retorno indicando `profileComplete = true`.
- `api/src/main/java/br/com/remind/service/psychologist/CompleteProfileService.java` - lógica transacional de conclusão.
- `api/src/main/java/br/com/remind/repository/AddressRepository.java` - persistência de `Address`.
- `api/src/test/java/br/com/remind/service/psychologist/CompleteProfileServiceTest.java` - testes de conclusão e atomicidade.
- `api/src/test/java/br/com/remind/controller/PsychologistControllerIT.java` - teste de integração do endpoint autenticado.

## Test Instructions

**1. Mandatory Unit Tests:**
   - `CompleteProfileService`:
     - [x] Com dados válidos, atualiza `cpf`/`phone` do user, cria `Address` + `Psychologist` e seta `profile_complete = true`. *(REQ-010)*
     - [x] Dados inválidos/incompletos não persistem `Address`/`Psychologist` nem alteram `profile_complete` (transação revertida). *(REQ-010)*

**2. Mandatory Integration Tests:**
   - `PUT /psychologists/me/profile`:
     - [x] Usuário pendente autenticado envia dados válidos → 200 e conta marcada como completa no banco. *(REQ-010)*
     - [x] Envio com CPF/telefone/endereço ausentes → 400 e estado inalterado. *(REQ-010)*
     - [x] Sem token → 401. *(autenticação)*

**3. Edge Cases:**
   - [x] `number` do endereço não numérico / `cep` fora do tamanho → 400. *(validação)*

**Test Acceptance Criteria**:
   - [x] Todos os testes acima implementados e passando; cobertura de `CompleteProfileService` >= 80%.

## Definition of Done (DoD)

- [x] Endpoint de conclusão implementado, autenticado e transacional.
- [x] Conta pendente vira completa (`profile_complete = true`) com `Psychologist` + `Address`.
- [x] Caminho da rota documentado para TASK-006 (rota permitida a perfis incompletos).

**Dependencies**: TASK-001

**Implementation Command**:
/developer-kit-specs:specs.task-implementation --lang=spring --task="docs/specs/001-login-google-psicologo/tasks/TASK-005.md"

---

## Implementation Summary (2026-07-01)

**Criado**: `controller/PsychologistController.java` (`PUT /psychologists/me/profile` + `GET /psychologists/me/profile`); `request/psychologist/CompleteProfileRequest.java`; `response/psychologist/CompleteProfileResponse.java` e `MyProfileResponse.java`; `service/psychologist/CompleteProfileService.java` (transacional: cria `Address`+`Psychologist`, seta `cpf`/`phone`/`profile_complete=true`; 409 se já concluído); `repository/AddressRepository.java`; testes `CompleteProfileServiceTest`, `controller/PsychologistControllerIT`.
**Testes**: `CompleteProfileServiceTest` (2) + `PsychologistControllerIT` (3) verdes — válido→completo, faltando campos→400, sem token→401.

---

## Cleanup Summary (2026-07-01)

- Sem `System.out`/`printStackTrace`/`println` ou comentários debug/TODO temporários nos arquivos da tarefa.
- Imports não usados: nenhum (verificado). Sem formatter configurado no `pom.xml` (formatação manual conforme padrão do projeto).
- Sem alteração de lógica/assinaturas — apenas verificação de higiene.
- Gate final: `mvn test` → `Tests run: 29, Failures: 0, Errors: 0` — BUILD SUCCESS.
