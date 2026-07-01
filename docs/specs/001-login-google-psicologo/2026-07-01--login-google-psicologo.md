# Especificação Funcional: Login com Google (Psicólogo) — Backend

- **Spec ID**: 001-login-google-psicologo
- **Data**: 2026-07-01
- **Status**: Draft
- **Escopo**: Backend (ReMind API)

---

## Contexto de Negócio

**Problema**: Hoje o backend ReMind autentica psicólogos apenas por email + senha
(`POST /login`), e não há fluxo de cadastro (usuários são semeados manualmente).
Isso cria atrito no acesso e impede um onboarding rápido.

**Objetivo**: Permitir que **psicólogos** entrem e se cadastrem por meio de
"Continuar com o Google", criando uma conta nova ou vinculando o Google a uma conta
existente, mantendo o mesmo formato de token de acesso já emitido pela aplicação.

**Usuários e metas**:
- **Psicólogo novo**: acessar rapidamente sem preencher formulário completo de início.
- **Psicólogo existente**: entrar com o Google reconhecendo sua conta atual.

**Encaixe no sistema**: A funcionalidade complementa o login por senha existente,
reutilizando a emissão do token de acesso da aplicação. Pacientes não têm acesso a
esta funcionalidade.

---

## Clarifications

### Session 2026-07-01
- Q: O que uma conta de psicólogo com perfil incompleto pode fazer com o token emitido? → A: Token restrito — só autoriza o endpoint de conclusão de perfil (e leitura do próprio perfil); demais endpoints retornam 403 até o perfil ficar completo.
- Q: Ao vincular o Google a uma conta de psicólogo existente, os dados de perfil (ex.: nome) devem ser sobrescritos pelos do Google? → A: Não; manter os dados existentes, apenas adicionar o vínculo da identidade Google.

---

## Requisitos Funcionais

Sintaxe EARS (SHALL/WILL/MAY). Todos testáveis.

| ID | Requisito |
|----|-----------|
| REQ-001 | O sistema SHALL expor uma operação de backend que recebe um ID token do Google emitido para a aplicação ReMind e autentica um psicólogo. |
| REQ-002 | WHEN um ID token do Google é recebido THEN o sistema SHALL validar assinatura, emissor, audiência e expiração, e verificar `email_verified`, antes de confiar em qualquer informação do token. |
| REQ-003 | IF o ID token é inválido ou expirado, OU `email_verified` é falso, THEN o sistema SHALL rejeitar a requisição e SHALL NOT criar ou vincular qualquer conta. |
| REQ-004 | WHEN o email do token corresponde a uma conta de psicólogo existente THEN o sistema SHALL vincular a identidade Google a essa conta e emitir o token de acesso da aplicação. |
| REQ-005 | WHEN o email do token corresponde a uma conta de paciente THEN o sistema SHALL rejeitar o acesso, pois apenas psicólogos podem usar esta funcionalidade. |
| REQ-006 | WHEN o email do token não corresponde a nenhuma conta existente THEN o sistema SHALL criar uma nova conta de psicólogo com o nome e email do Google, marcá-la como perfil incompleto e emitir o token de acesso da aplicação. |
| REQ-007 | O sistema SHALL emitir o mesmo formato de token de acesso usado pelo login por email/senha (token, tempo de expiração e tipo de usuário). |
| REQ-008 | O sistema SHALL indicar no resultado do login se o psicólogo autenticado precisa completar o perfil. |
| REQ-009 | Uma conta de psicólogo criada via Google SHALL poder existir sem senha, CPF, telefone e endereço até a conclusão do perfil. |
| REQ-010 | WHEN um psicólogo com perfil incompleto envia os dados obrigatórios (CPF, telefone e endereço) THEN o sistema SHALL concluir o perfil e marcar a conta como completa. |
| REQ-011 | IF um login por email/senha é tentado em uma conta que não possui senha (criada apenas via Google) THEN o sistema SHALL rejeitar o acesso, informando que a conta utiliza login do Google. |
| REQ-012 | O sistema SHALL armazenar a associação da identidade Google à conta para que logins Google subsequentes reconheçam a mesma conta. |
| REQ-013 | WHILE uma conta de psicólogo estiver com perfil incompleto, o sistema SHALL autorizar apenas a operação de conclusão de perfil e a leitura do próprio perfil, e SHALL negar (403) as demais operações protegidas. |
| REQ-014 | WHEN a identidade Google é vinculada a uma conta de psicólogo existente THEN o sistema SHALL preservar os dados de perfil já cadastrados (nome e demais campos) e SHALL apenas adicionar a associação da identidade Google. |

**Dados envolvidos (o quê, não como)**:
- Do Google: nome, email, indicador de email verificado, identificador único da conta Google.
- Da aplicação: conta de psicólogo (identidade Google associada, indicador de perfil
  incompleto), dados de perfil a completar (CPF, telefone, endereço).

**Capacidades externas necessárias**:
- Verificação de autenticidade do ID token junto ao provedor de identidade do Google.

---

## Interações do Usuário

### Fluxo 1 — Primeiro acesso (conta nova)
1. O psicólogo autoriza a aplicação na tela do Google e o backend recebe o ID token.
2. O sistema valida o token e verifica que o email não existe.
3. O sistema cria a conta de psicólogo (perfil incompleto) e emite o token de acesso.
4. O resultado indica que o perfil deve ser completado.

### Fluxo 2 — Login recorrente (conta já vinculada)
1. O backend recebe o ID token válido.
2. O sistema encontra a conta associada e emite o token de acesso.

### Fluxo 3 — Vínculo de conta existente
1. O backend recebe o ID token válido de um email já cadastrado como psicólogo.
2. O sistema associa a identidade Google à conta e emite o token de acesso.

### Fluxo 4 — Conclusão de perfil
1. Um psicólogo com perfil incompleto envia CPF, telefone e endereço.
2. O sistema conclui o perfil e marca a conta como completa.

### Caminhos alternativos e erros
- **Token inválido/expirado**: acesso negado, sem criação/vínculo (REQ-003).
- **Email não verificado**: acesso negado (REQ-003).
- **Email de paciente**: acesso negado, apenas psicólogos (REQ-005).
- **Login por senha em conta só-Google**: negado com orientação de usar o Google (REQ-011).
- **Conta pendente tentando operação protegida**: negado (403) até concluir o perfil (REQ-013).
- **Vínculo em conta existente**: dados de perfil não são sobrescritos pelos do Google (REQ-014).

---

## Critérios de Aceite

Taxonomia: `[IMP]` Implementável · `[SEF]` Efeito colateral · `[EXT]` Verificação externa.

- **[IMP]** Dado um ID token válido de um email inexistente, quando enviado ao
  backend, então uma conta de psicólogo com perfil incompleto é criada e um token de
  acesso é retornado. (REQ-006)
- **[IMP]** Dado um ID token válido cujo email é de um psicólogo existente, quando
  enviado, então a identidade Google é vinculada e um token de acesso é retornado. (REQ-004)
- **[IMP]** Dado um ID token válido cujo email é de um paciente, quando enviado,
  então o acesso é negado. (REQ-005)
- **[IMP]** Dado um ID token inválido, expirado ou com email não verificado, quando
  enviado, então o acesso é negado e nenhuma conta é criada ou vinculada. (REQ-003)
- **[IMP]** Dado um psicólogo com perfil incompleto, quando ele envia CPF, telefone e
  endereço válidos, então o perfil é concluído e a conta fica completa. (REQ-010)
- **[IMP]** Dado um login bem-sucedido, quando o resultado é retornado, então ele
  indica se o perfil precisa ser completado. (REQ-008)
- **[IMP]** Dado um login Google bem-sucedido, quando o token é emitido, então ele
  segue o mesmo formato do login por email/senha. (REQ-007)
- **[IMP]** Dado uma conta de psicólogo com perfil incompleto, quando o token é usado
  em uma operação protegida que não seja a conclusão/leitura do próprio perfil, então o
  acesso é negado com 403. (REQ-013)
- **[IMP]** Dado o vínculo do Google a uma conta existente, quando concluído, então o
  nome e demais dados de perfil permanecem inalterados e apenas a associação Google é
  adicionada. (REQ-014)
- **[SEF]** Dado uma conta criada apenas via Google (sem senha), quando um login por
  email/senha é tentado, então o acesso falha com mensagem indicando login do Google. (REQ-011)
- **[EXT]** A tela de consentimento e autorização é exibida pelo Google no frontend
  (fora do backend).

**Regra dos 60%**: 9 de 11 critérios são `[IMP]` (~82%).

---

## Requisitos de Integração

- **Provedor de identidade Google**: o sistema precisa verificar a autenticidade dos
  ID tokens junto às chaves públicas do Google (capacidade, não implementação).
- **Emissão de token da aplicação**: reutiliza o mesmo mecanismo de emissão de token
  já usado pelo login por email/senha.
- **Cadastro de perfil de psicólogo**: a conclusão de perfil reutiliza os dados
  obrigatórios de psicólogo já existentes (CPF, telefone, endereço).

**Troca de dados**: o backend recebe um ID token do frontend e devolve um token de
acesso da aplicação e a indicação de perfil incompleto.

---

## Não-Objetivos

Esta funcionalidade NÃO inclui:

- **Login Google para pacientes**: apenas psicólogos podem usar; pacientes seguem fora de escopo.
- **Trabalho de frontend/UI**: botão "Continuar com o Google" e tela de consentimento são do frontend.
- **Outros provedores sociais**: Apple, Facebook e afins não fazem parte deste escopo.
- **Fluxo de redirect server-side completo**: o backend não conduz o redirecionamento/callback do Google.
- **Painel administrativo de contas**: sem ferramenta de merge/gerência manual de contas.

---

## Requisitos Negativos

O sistema SHALL NOT:

### Segurança
- **REQ-NR001**: IF um claim do Google é usado THEN o sistema SHALL NOT confiar nele
  sem verificar a assinatura do token contra as chaves públicas publicadas do Google.
- **REQ-NR002**: O sistema SHALL NOT criar ou vincular conta quando `email_verified` for falso.
- **REQ-NR003**: O sistema SHALL NOT permitir que uma conta de paciente autentique via Google.
- **REQ-NR004**: O sistema SHALL NOT armazenar o ID token do Google nem utilizá-lo
  como token de sessão da aplicação.

---

## Questões em Aberto

Nenhuma pendência bloqueante. Decisões de escopo confirmadas com o usuário (ver
`decision-log.md`).
