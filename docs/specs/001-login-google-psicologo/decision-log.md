# Decision Log: Login com Google (Psicólogo)

| ID | Data | Tarefa | Decisão | Alternativas | Impacto | Decidido por |
|----|------|--------|---------|--------------|---------|--------------|
| DEC-001 | 2026-07-01 | Brainstorming | Abordagem balanceada: login Google que cria conta pendente ou vincula conta existente de psicólogo | MVP só-vínculo; abrangente com dados mínimos permanentes | Estrutura da spec e critérios de aceite | usuário |
| DEC-002 | 2026-07-01 | Fluxo de credencial | Frontend envia o ID token; backend valida e emite o JWT próprio | Fluxo redirect server-side completo | Contrato do backend (endpoint recebe idToken); backend permanece "apenas backend" | usuário |
| DEC-003 | 2026-07-01 | Criação de conta | Conta pendente + completar perfil (CPF/telefone/endereço) depois | Só vincular; criar com dados mínimos permanentes | Campos `password`/`cpf`/`phone` nullable; etapa de conclusão de perfil | usuário |
| DEC-004 | 2026-07-01 | Regra de vínculo | Vincular automaticamente se `email_verified=true`; paciente rejeitado | Exigir estar logado com senha para vincular | Segurança/UX; exige `email_verified` no token | usuário |
| DEC-005 | 2026-07-01 | Confirmação própria | Sem etapa de confirmação da aplicação; cria conta pendente direto no primeiro acesso | Exigir confirmação antes de criar | Fluxo de primeiro acesso mais simples | usuário |
| DEC-006 | 2026-07-01 | TASK-001 | Adicionar H2 (test scope) e usar `@DataJpaTest` com `ddl-auto=create-drop` para o slice de `UserRepository` | Testcontainers+Postgres (exige Docker no CI); sem slice test | Nova dependência de teste; slice roda sem infraestrutura; coerência com `schema.sql`/Postgres fica a cargo do `@SpringBootTest` | implementador |
| DEC-007 | 2026-07-01 | TASK-002 | Rejeitar login com `ResponseStatusException(401)` em vez de `BadCredentialsException` | Manter `BadCredentialsException` | `BadCredentialsException` caía no handler de `RuntimeException`→500; agora retorna 401 correto e alinhado à convenção do projeto | implementador |
| DEC-008 | 2026-07-01 | TASK-007 | `src/test/resources/application.yaml` com H2 (`NON_KEYWORDS=VALUE`, `create-drop`) para rodar `@SpringBootTest`/E2E sem Postgres; `GoogleTokenVerifier` mockado via `@MockitoBean` | Testcontainers+Postgres; JWKS de teste local | ITs/E2E determinísticos e sem rede; `NON_KEYWORDS=VALUE` contorna `value` reservado no H2 (coluna de `question_options`) | implementador |
| DEC-009 | 2026-07-01 | TASK-004..007 | Corrigir artefato compilado obsoleto (`calculator/QuestionnaireResultCalculator.class` em pacote antigo) via `mvn clean` | Ignorar | Contexto Spring não subia nos testes por classe stale; resolvido sem alterar código-fonte pré-existente | implementador |

## DEC-001: Seleção de Abordagem
- **Data**: 2026-07-01
- **Tarefa**: Brainstorming
- **Fase**: Seleção de abordagem
- **Contexto**: Escolha da abordagem funcional para login com Google restrito a psicólogos.
- **Decisão**: Abordagem balanceada — permitir criação (conta pendente) e vínculo de contas.
- **Alternativas consideradas**: MVP apenas-vínculo; abrangente com dados mínimos permanentes.
- **Impacto**: Estrutura da especificação, limites de escopo, critérios de aceite.
- **Decidido por**: seleção do usuário.
