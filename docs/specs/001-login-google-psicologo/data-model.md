# Data Model — Login com Google (Psicólogo)

**Spec**: `docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md`
**Generated**: 2026-07-01

> Derivado da especificação funcional, `brainstorming-notes.md` e do modelo existente
> (`api/data/schema.sql`, `br.com.remind.domain`). Termos seguem `docs/specs/ontology.md`.

---

## Entidades

### User (tabela `users`) — MODIFICADA

Identidade base do sistema. Passa a suportar **Conta Pendente** (só-Google) e o vínculo de **Identidade Google**.

| Campo | Tipo | Antes | Depois | Origem |
|-------|------|-------|--------|--------|
| `id` | BIGINT (PK) | — | inalterado | existente |
| `name` | VARCHAR(50) NOT NULL | obrigatório | inalterado (vem do Google na criação) | REQ-006 |
| `email` | VARCHAR(100) NOT NULL | obrigatório | inalterado (chave de busca/vínculo) | REQ-004, REQ-006 |
| `cpf` | VARCHAR(11) | NOT NULL | **nullable** | REQ-009 |
| `phone` | VARCHAR(11) | NOT NULL | **nullable** | REQ-009 |
| `password` | VARCHAR(255) | NOT NULL | **nullable** | REQ-009, REQ-011 |
| `type` | VARCHAR(15) NOT NULL | obrigatório | inalterado (`PSYCHOLOGIST` na criação Google) | REQ-006 |
| `google_sub` | VARCHAR(255) | — | **novo**, nullable, único quando presente | REQ-012 |
| `profile_complete` | BOOLEAN NOT NULL | — | **novo**, default `FALSE` | REQ-008, REQ-013 |
| `created_at` / `updated_at` | DATE NOT NULL | obrigatório | inalterado | existente |
| `active` | BOOLEAN NOT NULL | obrigatório | inalterado | existente |

**Invariantes**:
- Uma conta pendente pré-cadastrada (hoje via SQL/pgweb, antes do primeiro login
  Google — REQ-006 revertido em 2026-07-13, deixou de ser criada automaticamente
  pelo próprio login) tem `password = NULL`, `cpf = NULL`, `phone = NULL`,
  `profile_complete = FALSE`, `type = PSYCHOLOGIST`, `google_sub = NULL` até o
  primeiro login vincular a identidade. (REQ-006, REQ-009)
- `google_sub` guarda o identificador único da conta Google para reconhecimento em logins subsequentes. (REQ-012)
- Contas semeadas por senha (`insert.sql`) mantêm `profile_complete = TRUE` e `google_sub = NULL`.
- Login por senha exige `password != NULL`; contas só-Google rejeitam login por senha. (REQ-011)

### Psychologist (tabela `psychologists`) — INALTERADA

Criada **apenas na Conclusão de Perfil**, não no primeiro login Google.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGINT (PK) | existente |
| `id_user` | BIGINT NOT NULL (FK users) | vincula ao `User` |
| `id_address` | BIGINT NOT NULL (FK addresses) | exige `Address` |
| `created_at` / `updated_at` / `active` | — | existente |

### Address (tabela `addresses`) — INALTERADA

Criado na Conclusão de Perfil (street, number, cep, neighborhood, city). (REQ-010)

---

## Objetos de valor / DTOs (não persistidos)

| Objeto | Campos | Origem |
|--------|--------|--------|
| ID Token do Google (entrada) | JWT assinado; claims usados: `sub`, `email`, `email_verified`, `name`, `iss`, `aud`, `exp` | REQ-001, REQ-002 |
| `GoogleLoginRequest` | `idToken` | REQ-001 |
| `LoginResponse` (estendido) | `accessToken`, `expiresIn`, `type`, `profileComplete` | REQ-007, REQ-008 |
| `CompleteProfileRequest` | `cpf`, `phone`, `street`, `number`, `cep`, `neighborhood`, `city` | REQ-010 |

---

## Transições de estado (Conta de Psicólogo)

```
[inexistente] --login Google (email novo)--> [Conta Pendente / profile_complete=FALSE]
[Conta Pendente] --Conclusão de Perfil (CPF+telefone+endereço)--> [Conta Completa / profile_complete=TRUE]
[Psicólogo existente por senha] --login Google (mesmo email)--> [+ google_sub vinculado] (dados preservados, REQ-014)
```

**Regra de autorização por estado** (REQ-013): enquanto `profile_complete = FALSE`, o token só autoriza a conclusão de perfil e a leitura do próprio perfil; demais operações protegidas retornam 403.

---

## Notas de persistência

- Schema mantido em `api/data/schema.sql` com `ddl-auto: validate` — entidade e schema devem mudar juntos.
- `google_sub` nullable com unicidade (índice único parcial ou constraint aplicada apenas quando não nulo).
- O ID token do Google **não** é persistido (REQ-NR004) — usado apenas em memória durante a validação.

## Elementos derivados (não são requisitos da spec)

- `(derived)` Uso de `NimbusJwtDecoder` como mecanismo de validação — decisão técnica (AD-001), não requisito funcional.
- `(derived)` Extração de `AccessTokenService` — refino de implementação (AD-003) para evitar duplicação; a spec exige apenas "mesmo formato de token" (REQ-007).
- `(derived)` Estratégia de índice único parcial para `google_sub` — detalhe de banco; a spec exige apenas reconhecer a mesma conta (REQ-012).
