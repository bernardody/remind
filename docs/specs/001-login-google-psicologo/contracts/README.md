# Contracts — Login com Google (Psicólogo)

Interfaces explícitas descritas pela especificação funcional. Detalhes neutros de
implementação (inputs, outputs, erros).

| Arquivo | Boundary | Descrição |
|---------|----------|-----------|
| `login-google.openapi.yaml` | HTTP público | `POST /login/google` — autentica/cria/vincula psicólogo a partir do ID token do Google |
| `complete-profile.openapi.yaml` | HTTP autenticado | `PUT /psychologists/me/profile` — conclui o perfil de uma Conta Pendente |

## Boundaries implícitos preservados por estas tarefas

- **Login por senha (`POST /login`)**: contrato existente; a resposta passa a incluir
  `profileComplete` (aditivo). Contas só-Google são rejeitadas neste endpoint (REQ-011).
- **Provedor de identidade Google (externo)**: validação do ID token contra o JWKS
  público do Google (`https://www.googleapis.com/oauth2/v3/certs`). Capacidade externa,
  não um endpoint próprio.
- **Autorização por estado de perfil (REQ-013)**: enquanto `profile_complete = FALSE`,
  apenas a conclusão de perfil e a leitura do próprio perfil são autorizadas; demais
  endpoints protegidos retornam 403.
