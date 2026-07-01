# Brainstorming Notes — Login com Google (Psicólogo)

Notas técnicas para orientar `spec-to-tasks`. NÃO fazem parte da spec funcional.

## Reuso no código existente
- ID token do Google é um **JWT** → validar com `NimbusJwtDecoder.withJwkSetUri(...)`
  apontando para as chaves públicas do Google (mesma lib já usada em
  `br.com.remind.config.SecurityConfig`), sem nova dependência de `oauth2-client`.
- Emissão do JWT da aplicação: reutilizar o padrão de `LoginController`
  (`JwtEncoder`, claims `issuer=tcc`, `subject`, `email`, `expiresIn=600`).
- `UserRepository.findByEmail` / `existsByEmail` para localizar/vincular contas.
- `LoginResponse(accessToken, expiresIn, type)` já existe → estender com `profileComplete`.

## Mudanças de modelo/infra previstas
- `users.password`, `users.cpf`, `users.phone` → tornar **nullable** (conta só-Google/pendente).
- Adicionar `users.google_sub` (id único da conta Google, nullable) e
  `users.profile_complete` (boolean). Atualizar entidade `User` e `data/schema.sql`.
- Linha `Psychologist` (+ `Address`, que é NOT NULL) é criada apenas na **conclusão
  do perfil**, não na criação via Google.

## Endpoints
- `POST /login/google` com corpo `{ idToken }`, em `permitAll` (ajustar `SecurityConfig`,
  hoje só `POST /login` é público).
- Endpoint autenticado para completar perfil (CPF, telefone, endereço) → cria
  `Psychologist` + `Address` e seta `profile_complete = true`.

## Configuração
- Propriedade `google.client-id` (audiência esperada) em `application.yaml`.
- Validadores de issuer (`accounts.google.com` / `https://accounts.google.com`) e
  audience no decoder do token Google.

## Ajustes no login existente
- `LoginController` deve tratar `password == null`: rejeitar login por senha em conta
  só-Google com mensagem apropriada (REQ-011).

## Testes sugeridos
- Token válido novo → cria pendente + flag.
- Email de psicólogo existente → vincula.
- Email de paciente → negado.
- Token inválido / `email_verified=false` → negado, sem criar/vincular.
- Login por senha em conta só-Google → mensagem específica.
- Concluir perfil → conta completa.
