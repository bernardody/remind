# Spec 01 — Infraestrutura: Deploy do backend via EasyPanel

> **Nota histórica:** a primeira versão desta spec previa um stack próprio com
> `docker-compose` + Nginx + Certbot no VPS. Esse plano foi **abandonado** porque o
> VPS da Hostinger já roda um **EasyPanel com Traefik** ocupando as portas 80/443
> (junto de n8n, Chatwoot, Evolution API e outras automações que não podem ser
> removidas). Como dois proxies reversos não dividem as portas 80/443, o backend
> foi integrado à infra que já existia. Este documento descreve o que está **de
> fato em produção**.

## Objetivo

Backend Spring Boot em produção no VPS Hostinger, com HTTPS (Let's Encrypt via
Traefik) e deploy automático a cada push na branch `main`.

## Visão geral da arquitetura

```
Internet
   │  443 (HTTPS)
   ▼
Traefik (EasyPanel)  ──►  api.remindapp.com.br   ──►  container API (Spring Boot :8080)
   │                                                      │
   │                                                      ▼
   └──►  painel.remindapp.com.br ──► EasyPanel        Postgres (remind_db:5432)
```

- **VPS**: Hostinger, IP `76.13.161.182`, Ubuntu, Docker (Swarm, gerenciado pelo EasyPanel).
- **DNS**: gerenciado no **registro.br** (domínio `remindapp.com.br`), não no hPanel.
  - `api.remindapp.com.br`  → A → `76.13.161.182`
  - `painel.remindapp.com.br` → A → `76.13.161.182`
- **SSL**: Let's Encrypt automático pelo Traefik (renovação automática, sem cron).
- **Firewall** (hPanel + ufw): libera apenas 22, 80 e 443. A porta 3000 do EasyPanel
  fica fechada — o painel é acessado por `https://painel.remindapp.com.br`.

---

## Arquivos no repositório usados pelo deploy

```
remind/
├── api/
│   ├── Dockerfile                                     # build multi-stage (Maven → JRE Alpine)
│   └── src/main/resources/
│       ├── application.yaml                           # dev local
│       └── application-prod.yaml                      # produção; lê DB_URL/DB_USER/DB_PASSWORD do ambiente
└── .gitignore                                         # ignora .env
```

`application-prod.yaml` lê a URL do banco de `${DB_URL:...}`, então o host do Postgres
é injetado por variável de ambiente no EasyPanel (não fica fixo no código).

---

## Configuração no EasyPanel

Projeto **`remind`** com dois serviços:

### Serviço `db` (Postgres)
- Template Postgres do EasyPanel.
- Host interno: `remind_db` · porta `5432` · database `remind` · user `postgres`.
- Credenciais geradas pelo EasyPanel (a senha vive só lá e nas env vars do app).

### Serviço `api` (App)
- **Source**: Git → `https://github.com/bernardody/remind.git` · branch `main` · **Build Path `/api`**.
- **Build**: Dockerfile → `Dockerfile` (relativo ao Build Path).
- **Environment**:
  ```
  SPRING_PROFILES_ACTIVE=prod
  DB_URL=jdbc:postgresql://remind_db:5432/remind
  DB_USER=postgres
  DB_PASSWORD=<senha gerada pelo Postgres do EasyPanel>
  ```
- **Domains**: `api.remindapp.com.br` → Protocolo HTTP, **porta 8080**, HTTPS + SSL ativados.

---

## Inicialização do banco (uma vez)

O perfil de produção usa `ddl-auto: validate`, ou seja, **a aplicação não cria
tabelas** — o schema precisa existir antes. Importação manual, via SSH no VPS:

```bash
CID=$(docker ps -q --filter "name=remind_db")
docker exec -i "$CID" psql -U postgres -d remind < api/data/schema.sql
docker exec -i "$CID" psql -U postgres -d remind < api/data/insert.sql
docker exec -i "$CID" psql -U postgres -d remind -c "\dt"   # conferir tabelas
```

> `insert.sql` carrega usuários fictícios para validação inicial — remover quando
> houver dados reais.

---

## Deploy contínuo (CI/CD)

Webhook do GitHub aciona o **Gatilho de Implantação** do EasyPanel:

- EasyPanel → serviço `api` → seção "Gatilho de Implantação" fornece a URL.
- No GitHub (`Settings → Webhooks`): Payload URL =
  `https://painel.remindapp.com.br/api/deploy/<token>` (usar o **domínio HTTPS**,
  não `IP:3000`, que está fechado), Content type `application/json`, evento `push`.
- A cada push na `main`, o EasyPanel refaz o build e sobe a nova versão.

---

## Verificação

```bash
# HTTPS + login (retorna um JWT). Usuário válido vem do insert.sql:
curl -X POST https://api.remindapp.com.br/login \
  -H "Content-Type: application/json" \
  -d '{"email":"camila.nogueira.cf@gmail.com","password":"123456"}'
```

`GET /` sem token retorna 401 (Spring Security) — comportamento esperado.

---

## Pendências conhecidas

- **Bug**: login com credenciais erradas retorna **500** em vez de 401
  (`GlobalExceptionHandler` trata `BadCredentialsException` como `RuntimeException`).
- **Dados de teste**: remover `insert.sql` de produção após o MVP.
- **Backup**: ativar agendamento de backup do Postgres no EasyPanel.
- **Limpeza opcional**: o repo é público, então o token na URL de Source do EasyPanel
  poderia ser removido.
