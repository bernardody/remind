# Spec 05 — Login com Google (Psicólogo)

> Feature de **backend** já implementada, revisada e testada.
> Detalhe completo (tasks, contratos, decisões, rastreabilidade) no bundle de engenharia:
> [`docs/specs/001-login-google-psicologo/`](../../docs/specs/001-login-google-psicologo/2026-07-01--login-google-psicologo.md).
> **Status:** implementada e verificada (29 testes verdes). Contratos baseados no código real em `/api`.

---

## 0. O que muda no contrato da API (validado no código)

Base: `localhost:8080` dev · `https://api.remindapp.com.br` prod. Auth: Bearer JWT RS256, `expiresIn: 600s`.

| Método | Rota | Público? | DTO resposta / body |
|---|---|---|---|
| POST | `/login/google` | **sim** (permitAll) | body: `{ idToken }` → `{ accessToken, expiresIn, type, profileComplete }` |
| PUT | `/psychologists/me/profile` | não (Bearer) | body: `{ cpf, phone, street, number, cep, neighborhood, city }` → `{ profileComplete: true }` |
| GET | `/psychologists/me/profile` | não (Bearer) | `{ name, email, type, profileComplete }` |
| POST | `/login` | sim | **agora retorna `profileComplete`** → `{ accessToken, expiresIn, type, profileComplete }` |

> ✅ **Login 500→401 resolvido:** credencial errada (e conta só‑Google) agora retorna **401** com mensagem,
> não mais 500. A observação da [Spec 04 §0](04-spec-aplicacao.md) sobre "tratar 500 como inválido" fica obsoleta para o `/login`.

---

## 1. Comportamento do `/login/google`

O frontend faz o sign‑in do Google (Google Identity Services) e envia **apenas o `idToken`**. O backend valida
(assinatura via JWKS do Google, emissor, audiência = `GOOGLE_CLIENT_ID`, expiração) e ramifica:

| Situação | Resultado |
|---|---|
| E‑mail inexistente | Cria **conta pendente** de psicólogo (`profileComplete=false`, sem senha/CPF/telefone) + token |
| E‑mail de psicólogo existente | **Vincula** a identidade Google (não sobrescreve dados) + token |
| Login recorrente | Reconhece a mesma conta, sem duplicar |
| E‑mail de paciente | **403** — não cria/vincula |
| Token inválido/expirado ou `email_verified=false` | **401** — não cria/vincula |

---

## 2. Autorização por perfil incompleto (REQ‑013)

Enquanto `profileComplete=false`, o token **só** autoriza:
- `PUT /psychologists/me/profile` (conclusão)
- `GET /psychologists/me/profile` (leitura do próprio perfil)

Qualquer outra rota protegida retorna **403** (`"Conclua seu perfil para acessar esta operação."`).
Sem token continua **401** (não 403).

---

## 3. Implicações para o frontend

| Item | O quê |
|---|---|
| Botão Google | Google Identity Services com `client_id = GOOGLE_CLIENT_ID` → envia `idToken` ao `POST /login/google`. |
| Roteamento pós‑login | Se `profileComplete=false` → tela de **conclusão de perfil**; senão → dashboard. Vale para `/login` e `/login/google`. |
| Tela de conclusão | Form CPF, telefone, endereço (`cep` = 8 dígitos) → `PUT /psychologists/me/profile`. |
| Tratamento de 403 | Numa conta incompleta, chamadas a outras rotas retornam 403 → redirecionar para a conclusão de perfil. |
| Rejeições | 403 (paciente) e 401 (token inválido) tratados na tela de login. |

---

## 4. Configuração / operação

| Ambiente | Necessário |
|---|---|
| Todos | Env var `GOOGLE_CLIENT_ID` (audiência esperada do ID token). Sem ela → 401. |
| Google Cloud | OAuth Client ID (Web app); **Authorized JavaScript origins** = origem do front. Consent screen publicada em produção (fora do modo Testing). |
| Banco | Colunas `google_sub`, `profile_complete` e `cpf/phone/password` nullable em `users`. Em prod **usar `ALTER`**, nunca o `schema.sql` (que dá `DROP`). |

---

## 5. Pendências antes do merge/produção

- Remover a página temporária de teste (`api/src/main/resources/static/login-google.html`) e a liberação dela no `SecurityConfig`.
- Aplicar a migração `ALTER` no Postgres de produção (ver bundle de engenharia).
- Definir `GOOGLE_CLIENT_ID` no ambiente e publicar a consent screen.
- Ligar o botão de Google no frontend (Spec 04, Fase 2) usando o contrato acima.
