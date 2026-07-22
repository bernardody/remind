#!/bin/sh
set -eu

# Chave JWT NUNCA é comitada nem embutida na imagem (ver PRODUCTION_AUDIT.md
# B-SEC-1 — a chave antiga vazou publicamente commitada no repo). Em produção
# ela chega só via env var (JWT_PRIVATE_KEY_B64/JWT_PUBLIC_KEY_B64, PEM
# codificado em base64 pra evitar problema de newline em painéis de env var) e
# é escrita em disco só dentro do container, a cada start.
mkdir -p /app/secrets

if [ -n "${JWT_PRIVATE_KEY_B64:-}" ]; then
  echo "$JWT_PRIVATE_KEY_B64" | base64 -d > /app/secrets/authz.pem
fi

if [ -n "${JWT_PUBLIC_KEY_B64:-}" ]; then
  echo "$JWT_PUBLIC_KEY_B64" | base64 -d > /app/secrets/authz.pub
fi

exec java -Duser.timezone=America/Sao_Paulo -jar app.jar
