# User Request

**Original Input**: "Quero implementar a funcionalidade de fazer login com o Google.
Apenas o psicólogo pode utilizar essa funcionalidade para criar ou vincular contas.
Esta tarefa deve servir apenas para o backend da aplicação. Leia a api/ e a
documentacao/ e faça perguntas relevantes, sempre levando em consideração o que já
pode ser usado para não inventar a roda."

**Key Requirements Mentioned**:
- Login com Google ("Continuar com o Google", com etapas de autorização/consentimento).
- Apenas psicólogos podem usar (criar ou vincular contas).
- Somente backend.
- Reutilizar o que já existe no código.

**Constraints**:
- Backend Spring Boot já autentica por email/senha e emite JWT próprio.
- Não existe endpoint de cadastro hoje (usuários semeados via insert.sql).
- Entidade/tabela `users` exige `password`, `cpf`, `phone` NOT NULL; `Psychologist`
  exige `Address` NOT NULL.

**Decisões confirmadas** (ver decision-log.md):
1. Frontend envia o ID token; backend valida e emite JWT.
2. Criação com conta pendente + completar perfil depois.
3. Vínculo automático se email verificado; paciente é rejeitado.
4. Sem etapa de confirmação própria — cria direto no primeiro acesso.
