# Spec 01 — Infraestrutura: VPS Hostinger + Docker + Nginx + SSL + CI/CD

## Objetivo

Colocar o backend Spring Boot em produção no VPS da Hostinger, com banco PostgreSQL isolado, HTTPS via Let's Encrypt e deploy automático via GitHub Actions a cada push na branch `main`.

## Pré-requisitos (verificar antes de começar)

- [ ] Acesso SSH ao VPS (IP, usuário root ou sudo, senha ou chave)
- [ ] Domínio apontando para o IP do VPS (registro A no DNS da Hostinger — painel hPanel > DNS Zone)
- [ ] Porta 80 e 443 abertas no firewall do hPanel (Hostinger > VPS > Firewall)
- [ ] Repositório no GitHub com acesso de admin (para criar Secrets)
- [ ] Java 21 e Maven instalados localmente para validar o build antes de subir

---

## Parte 1 — Configuração inicial do VPS

### 1.1 Primeiro acesso e hardening básico

```bash
# Conectar ao VPS
ssh root@<IP_DO_VPS>

# Atualizar pacotes
apt update && apt upgrade -y

# Criar usuário não-root para operações do dia a dia
adduser remind
usermod -aG sudo remind

# Copiar chave SSH para o novo usuário (se usou chave para o root)
rsync --archive --chown=remind:remind ~/.ssh /home/remind

# Configurar firewall básico
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 1.2 Instalar Docker e Docker Compose

```bash
# Instalar dependências
apt install -y ca-certificates curl gnupg

# Adicionar repositório oficial do Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Permitir que o usuário remind rode Docker sem sudo
usermod -aG docker remind

# Verificar instalação
docker --version
docker compose version
```

### 1.3 Clonar o repositório no VPS

```bash
su - remind

# Criar diretório de deploy
mkdir -p /home/remind/app
cd /home/remind/app

# Clonar o repositório (HTTPS — não precisa de chave SSH no servidor)
git clone https://github.com/bernardody/remind .
```

---

## Parte 2 — Arquivos a criar no repositório

Estes arquivos devem ser criados localmente e commitados. O CI/CD vai usá-los.

### 2.1 `api/Dockerfile`

Build em dois estágios: o primeiro compila com Maven, o segundo roda com JRE leve.

```dockerfile
# Estágio 1: build
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Baixa dependências em camada separada (cache no Docker)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Estágio 2: runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2.2 `api/src/main/resources/application-prod.yaml`

Perfil de produção que lê variáveis de ambiente. O `application.yaml` base continua válido para desenvolvimento local.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/remind
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate

server:
  error:
    include-message: never  # Não expor stack traces em produção
```

### 2.3 `docker-compose.yml` (raiz do repositório)

Três serviços: banco, API e proxy reverso.

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: remind
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./api/data/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
      - ./api/data/insert.sql:/docker-entrypoint-initdb.d/02-insert.sql:ro
    networks:
      - internal
    # Banco NÃO exposto para fora — só acessível internamente

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    restart: always
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      db:
        condition: service_started
    networks:
      - internal
      - external

  nginx:
    image: nginx:1.27-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - certbot-www:/var/www/certbot:ro
    depends_on:
      - api
    networks:
      - external

volumes:
  pgdata:
  certbot-www:

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

### 2.4 `nginx/nginx.conf`

```nginx
events {}

http {
    # Redireciona HTTP → HTTPS
    server {
        listen 80;
        server_name api.remind.com.br;  # Substituir pelo domínio real

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS — proxy para o Spring Boot
    server {
        listen 443 ssl;
        server_name api.remind.com.br;  # Substituir pelo domínio real

        ssl_certificate     /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        # Headers de segurança
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;

        location / {
            proxy_pass         http://api:8080;
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## Parte 3 — SSL com Let's Encrypt

Feito uma única vez no servidor, antes do primeiro deploy completo.

```bash
# No VPS, como remind
cd /home/remind/app

# Subir apenas o nginx em modo HTTP (sem SSL ainda) para validar o domínio
docker compose up -d nginx

# Instalar Certbot
apt install -y certbot

# Obter certificado (desafio webroot — nginx precisa estar rodando na porta 80)
certbot certonly \
  --webroot \
  --webroot-path /var/lib/docker/volumes/app_certbot-www/_data \
  -d api.remind.com.br \
  --email remindappbr@gmail.com \
  --agree-tos \
  --non-interactive

# Copiar certificados para o diretório montado no nginx
mkdir -p /home/remind/app/nginx/certs
cp /etc/letsencrypt/live/api.remind.com.br/fullchain.pem /home/remind/app/nginx/certs/
cp /etc/letsencrypt/live/api.remind.com.br/privkey.pem   /home/remind/app/nginx/certs/

# Subir tudo
docker compose up -d
```

### 3.1 Renovação automática do certificado

```bash
# Adicionar ao crontab do usuário remind
crontab -e

# Linha a adicionar (roda dia 1 de cada mês às 3h)
0 3 1 * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/api.remind.com.br/fullchain.pem /home/remind/app/nginx/certs/ && \
  cp /etc/letsencrypt/live/api.remind.com.br/privkey.pem   /home/remind/app/nginx/certs/ && \
  docker compose -f /home/remind/app/docker-compose.yml exec nginx nginx -s reload
```

---

## Parte 4 — Arquivo `.env` no VPS

Este arquivo **nunca entra no repositório** (adicionar ao `.gitignore`).

```bash
# /home/remind/app/.env
DB_USER=remind_user
DB_PASSWORD=<senha_forte_gerada>
```

Gerar senha forte:
```bash
openssl rand -base64 32
```

Adicionar ao `.gitignore` na raiz do repositório:
```
.env
nginx/certs/
```

---

## Parte 5 — CI/CD com GitHub Actions

### 5.1 Secrets a cadastrar no GitHub

Ir em: `github.com/bernardody/remind > Settings > Secrets and variables > Actions > New repository secret`

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP do VPS Hostinger |
| `VPS_USER` | `remind` |
| `VPS_SSH_KEY` | Chave SSH privada (ver abaixo como gerar) |
| `DB_USER` | `remind_user` |
| `DB_PASSWORD` | Mesma senha do `.env` |

**Gerar chave SSH para o GitHub Actions:**
```bash
# Na sua máquina local
ssh-keygen -t ed25519 -C "github-actions-remind" -f ~/.ssh/remind_deploy -N ""

# Conteúdo da chave PÚBLICA vai para o VPS
ssh-copy-id -i ~/.ssh/remind_deploy.pub remind@<IP_DO_VPS>
# ou manualmente: cat ~/.ssh/remind_deploy.pub >> /home/remind/.ssh/authorized_keys

# Conteúdo da chave PRIVADA vai para o Secret VPS_SSH_KEY no GitHub
cat ~/.ssh/remind_deploy
```

### 5.2 `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/remind/app
            git pull origin main
            echo "DB_USER=${{ secrets.DB_USER }}" > .env
            echo "DB_PASSWORD=${{ secrets.DB_PASSWORD }}" >> .env
            docker compose up -d --build
            docker compose ps
```

> O workflow conecta ao VPS via SSH, atualiza o código, recria o `.env` com os secrets do GitHub e sobe os containers. O `--build` reconstrói a imagem da API se o código mudou.

---

## Parte 6 — Sequência de execução (primeira vez)

Execute nesta ordem:

1. Criar os arquivos da Parte 2 no repositório local e fazer commit/push
2. Configurar DNS do domínio no hPanel da Hostinger (registro A)
3. Preparar o VPS (Partes 1.1 e 1.2)
4. Clonar repositório no VPS (1.3)
5. Criar o arquivo `.env` no VPS (Parte 4)
6. Emitir certificado SSL (Parte 3)
7. Fazer o primeiro `docker compose up -d --build` manualmente no VPS para validar
8. Configurar Secrets no GitHub (Parte 5.1)
9. Criar o arquivo `deploy.yml` e fazer push — a partir daí o CI/CD cuida do resto

---

## Parte 7 — Verificação

Após o primeiro deploy, confirmar que tudo funciona:

```bash
# No VPS: verificar se os containers estão rodando
docker compose ps

# Verificar logs da API (deve terminar com "Started RemindApplication")
docker compose logs api --tail=50

# Verificar logs do banco
docker compose logs db --tail=20

# Fora do VPS: testar o endpoint de login via HTTPS
curl -X POST https://api.remind.com.br/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psicologo1@remind.com","password":"123456"}'

# Deve retornar um JWT token
```

---

## Resumo dos arquivos a criar no repositório

```
remind/
├── api/
│   ├── Dockerfile                                     # CRIAR
│   └── src/main/resources/
│       ├── application.yaml                           # manter (dev local)
│       └── application-prod.yaml                      # CRIAR
├── nginx/
│   └── nginx.conf                                     # CRIAR
├── .github/
│   └── workflows/
│       └── deploy.yml                                 # CRIAR
├── docker-compose.yml                                 # CRIAR
└── .gitignore                                         # ATUALIZAR (.env, nginx/certs/)
```

---

## Decisões tomadas e por quê

| Decisão | Razão |
|---|---|
| Build dentro do Docker (multi-stage) | CI/CD não precisa ter Java instalado; imagem final é leve (JRE Alpine ~100MB) |
| PostgreSQL não exposto externamente | Reduz superfície de ataque; banco só acessível pelo container da API |
| Perfil `prod` separado | Dev local continua funcionando com `localhost`; produção usa variáveis de ambiente |
| `schema.sql` montado no Postgres como init script | Banco inicializa com o schema correto automaticamente na primeira subida |
| `insert.sql` também no init | Dados de teste disponíveis em produção para validação inicial; remover depois do MVP |
| Nginx como proxy | Termina SSL, adiciona headers de segurança, isola a porta 8080 |
| `appleboy/ssh-action` no CI | Action consolidada, sem dependências extras; deploy simples via SSH + git pull |
