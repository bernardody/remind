# Project Architecture — ReMind

**Created**: 2026-07-01
**Last Updated**: 2026-07-01

> Derivado do estado atual do backend (`api/`) e do `docs/specs/001-login-google-psicologo/2026-07-01--technical-plan.md`. Formaliza escolhas tecnológicas e de infraestrutura compartilhadas por todas as especificações.

---

## 1. Logical Architecture

### 1.1 Domains and Bounded Contexts

| Bounded Context | Description | Key Responsibilities | Dependencies |
|-----------------|-------------|----------------------|--------------|
| Autenticação | Verificação de identidade e emissão de tokens de acesso | Login por senha, login com Google, validação de ID token, emissão de JWT da aplicação | None — contexto núcleo |
| Cadastro | Criação e completude de contas de psicólogo | Conta pendente, conclusão de perfil (CPF/telefone/endereço) | Autenticação |
| Pacientes | Gestão de pacientes vinculados a psicólogos | CRUD de pacientes | Autenticação, Cadastro |
| Questionários | Aplicação e cálculo de questionários | CRUD/listagem de questionários, respostas, resultados | Pacientes |

### 1.2 Module Map

```
┌──────────────────────────────────────────────────────────────┐
│                        ReMind API                            │
├───────────────┬───────────────┬───────────────┬──────────────┤
│ Autenticação  │   Cadastro    │   Pacientes   │ Questionários│
│               │  → Autentic.  │  → Autentic.  │ → Pacientes  │
└───────────────┴───────────────┴───────────────┴──────────────┘
```

### 1.3 Shared Kernel

| Shared Concept | Used By | Description |
|---------------|---------|-------------|
| `User` (tabela `users`) | Todos | Identidade base; especializada por `psychologists` / `patients` |
| Emissão de JWT da aplicação | Autenticação | Formato único de token de acesso (`issuer=tcc`, `email`, `expiresIn`) |

### 1.4 Context Map

| Upstream | Downstream | Relationship Pattern | Notes |
|----------|-----------|---------------------|-------|
| Autenticação | Cadastro | Partnership | Login Google cria conta pendente que Cadastro completa |
| Autenticação | Pacientes / Questionários | Open Host Service | JWT valida acesso aos endpoints protegidos |

---

## 2. Infrastructure Architecture

### 2.1 Deployment Topology

```
[Browser/Frontend Next.js] ──HTTPS──▶ [EasyPanel reverse proxy]
                                            │
                                     ┌──────┴──────┐
                                     │  ReMind API  │  (Spring Boot, container)
                                     └──────┬──────┘
                                            │
                                     ┌──────┴──────┐
                                     │ PostgreSQL   │
                                     └─────────────┘
```

### 2.2 Infrastructure Components

| Component | Technology | Version | Purpose | Environment |
|-----------|-----------|---------|---------|-------------|
| Hosting | EasyPanel (Docker) | N/A | Orquestração de containers | Prod |
| Containerization | Docker | current | Empacotamento da aplicação | All |
| Primary Database | PostgreSQL | 16.x | Persistência relacional | All |
| Identity Provider (externo) | Google Identity (JWKS) | N/A | Chaves públicas para validar ID token | All |

### 2.3 Networking

| Network Zone | Description | Accessible From | Purpose |
|-------------|-------------|-----------------|---------|
| Público | Proxy EasyPanel (HTTPS) | Internet | Entrada da API |
| App | Container da API | Proxy | Aplicação Spring Boot |
| Dados | PostgreSQL | App | Banco de dados |

### 2.4 Scaling Strategy

| Component | Scaling Type | Trigger | Min / Max |
|-----------|-------------|---------|-----------|
| ReMind API | Vertical (manual) | Contexto acadêmico (TCC), baixa carga | 1 / 1 |
| PostgreSQL | Vertical (manual) | Uso de disco | N/A |

### 2.5 Environments

| Environment | Purpose | Access | Infra Differences |
|-------------|---------|--------|-------------------|
| Local | Desenvolvimento | localhost:8080 | PostgreSQL local (`application.yaml`) |
| Produção | TCC / demonstração | EasyPanel | `application-prod.yaml`, credenciais via variáveis |

---

## 3. Software Architecture

### 3.1 Technology Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Language | Java | 21 | `java.version` no `pom.xml` |
| Framework | Spring Boot | 4.0.2 | Parent POM |
| Web | spring-boot-starter-webmvc | BOM 4.0.2 | Controllers REST |
| Security | spring-boot-starter-security | BOM 4.0.2 | `SecurityConfig` (resource + authorization server) |
| JWT | spring-security-oauth2-jose (Nimbus) | BOM 4.0.2 | Emissão (`NimbusJwtEncoder`) e validação (`NimbusJwtDecoder`) |
| Persistence | spring-boot-starter-data-jpa | BOM 4.0.2 | Repositórios JPA |
| Validation | spring-boot-starter-validation | BOM 4.0.2 | `@Valid` nos DTOs |
| Boilerplate | Lombok | BOM 4.0.2 | Entidades/DTOs |
| Testing | spring-boot-starter-test | BOM 4.0.2 | JUnit 5, Mockito |

### 3.2 Data Architecture

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Primary Database | PostgreSQL | 16.x | `application.yaml` |
| ORM / Data Access | Hibernate (Spring Data JPA) | BOM 4.0.2 | Repositórios `JpaRepository` |
| Migrations | `data/schema.sql` + `ddl-auto: validate` | N/A | Sem Flyway/Liquibase — schema mantido à mão |
| Seed | `data/insert.sql` | N/A | Dados semeados |

### 3.3 Architectural Style

**Style**: Layered (camadas) — convenção existente em `br.com.remind`.

```
┌──────────────────────────────────────────────┐
│ controller/            (REST + request/response)│
├──────────────────────────────────────────────┤
│ service/               (regras de negócio)      │
├──────────────────────────────────────────────┤
│ domain/  repository/   (entidades + acesso JPA) │
├──────────────────────────────────────────────┤
│ config/                (Security, CORS, erros)  │
└──────────────────────────────────────────────┘
```

### 3.4 Project Structure

```
api/src/main/java/br/com/remind/
├── config/            # SecurityConfig, CorsConfig, GlobalExceptionHandler
├── controller/        # REST controllers
│   ├── request/       # DTOs de entrada (um por arquivo)
│   └── response/      # DTOs de saída (um por arquivo)
├── service/           # Regras de negócio por área
├── domain/            # Entidades JPA
├── repository/        # Interfaces JpaRepository
├── mapper/            # Mapeadores entidade <-> DTO
├── enums/             # Enums (UserType)
└── validator/         # Validações de domínio
api/src/main/resources/ # application.yaml, chaves JWT
api/data/               # schema.sql, insert.sql
```

### 3.5 Architectural Rules

- Regras de negócio ficam em `service/`; controllers apenas orquestram.
- Um DTO por arquivo em `request/` e `response/`.
- Injeção por construtor (Lombok `@RequiredArgsConstructor` ou construtor explícito). Sem `@Autowired` em campos.
- Emissão de JWT centralizada — não duplicar a lógica de token em múltiplos controllers.
- Nenhuma nova dependência no `pom.xml` sem justificativa (reusar o BOM 4.0.2).

### 3.6 Design Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| Repository | Acesso a dados | `UserRepository extends JpaRepository` |
| Service Layer | Regras de negócio | `SearchUserService`, `InsertPatientService` |
| DTO | Contrato de API | `LoginRequest`, `LoginResponse` |

### 3.7 API Conventions

| Aspect | Convention | Example |
|--------|-----------|---------|
| Authentication | Bearer JWT | `Authorization: Bearer <token>` |
| Error Format | JSON `{ timestamp, status, error, message, path }` | `GlobalExceptionHandler` |
| Sessão | STATELESS | `SessionCreationPolicy.STATELESS` |

### 3.8 Library Verification

#### Spring Security OAuth2 JOSE (Nimbus)

**Package**: `org.springframework.security:spring-security-oauth2-jose`
**Version**: gerenciada pelo BOM Spring Boot 4.0.2

**Approved APIs**:
| API | Signature | Purpose |
|-----|-----------|---------|
| `NimbusJwtDecoder.withJwkSetUri` | `(String jwkSetUri) -> NimbusJwtDecoder.JwkSetUriJwtDecoderBuilder` | Validar ID token do Google via JWKS |
| `NimbusJwtDecoder.withPublicKey` | `(RSAPublicKey) -> builder` | Validar JWT da própria aplicação (já em uso) |
| `NimbusJwtEncoder.encode` | `(JwtEncoderParameters) -> Jwt` | Emitir JWT da aplicação (já em uso) |
| `JwtValidators` / `OAuth2TokenValidator` | validadores de `issuer`/`audience`/`timestamp` | Restringir tokens aceitos |

**Usage Constraints**:
- Configurar validadores explícitos de `issuer` e `audience` para o decoder do Google.
- Não usar `spring-security-oauth2-client` (fluxo redirect fora de escopo — DEC-002).

---

## 4. Security Constraints

Aplicam-se as tabelas padrão (OWASP/CWE). Destaques para esta base:

- **CRITICAL** — Endpoints sensíveis exigem autenticação (`anyRequest().authenticated()`); apenas `/login` e `/login/google` são públicos.
- **CRITICAL** — Senhas com BCrypt (`BCryptPasswordEncoder`).
- **CRITICAL** — JWT com expiração e verificação de assinatura.
- **CRITICAL** — Não confiar em claims do Google sem verificar a assinatura contra o JWKS publicado (REQ-NR001).
- **CRITICAL** — Não armazenar o ID token do Google nem usá-lo como sessão (REQ-NR004).
- **CRITICAL** — Queries parametrizadas (Spring Data JPA / JPQL).

---

## 5. AI Guardrails

- **Library Verification**: usar apenas APIs listadas em 3.8; sem novas dependências no `pom.xml`.
- **Architectural Compliance**: respeitar as camadas de 3.3/3.4 e as regras de 3.5.
- Ler `docs/specs/architecture.md` e `docs/specs/ontology.md` no início da sessão.
- Gerar testes junto com o código de implementação.
- Manter `schema.sql` e entidades JPA em sincronia (`ddl-auto: validate` falha se divergirem).
