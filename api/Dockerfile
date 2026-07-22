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
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 8080
# `-Duser.timezone`: sem isso, o container (Alpine, sem tzdata/TZ configurado)
# roda em UTC e todo LocalDateTime.now() do backend (answered_at, created_at
# etc.) grava hora UTC como se fosse local — 3h adiantado do horário de
# Brasília real. Chave JWT materializada em runtime pelo entrypoint — nunca
# embutida na imagem (ver PRODUCTION_AUDIT.md B-SEC-1).
ENTRYPOINT ["/app/docker-entrypoint.sh"]
