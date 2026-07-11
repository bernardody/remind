---
name: verify
description: How to run this repo's backend (Spring Boot/api) + frontend (Next.js/remind-web) end-to-end locally against an isolated Postgres, and drive real HTTP requests through the actual Auth.js login + BFF proxy to verify a change.
---

# Verify: Remind (api + remind-web)

## Gotcha: port 5432 is already taken on this machine

This machine has a **native Windows Postgres service** (`postgres.exe`) already
listening on `0.0.0.0:5432` (visible as a Windows service, separate from
Docker). If you `docker run -p 5432:5432 postgres`, the Java app's
`jdbc:postgresql://localhost:5432/remind` (from `application.yaml`) may
silently connect to the **native** service instead of your throwaway
container — same host/port, different database, no error. You seed one and
query the other.

**Fix: always use a different host port for the test container** (e.g. 5433)
and pass `SPRING_DATASOURCE_URL` as an env override to `spring-boot:run`
rather than editing `application.yaml`:

```bash
docker run --name remind-test-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=remind -p 5433:5432 -d postgres:16
until docker exec remind-test-pg pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

cd api/data
docker cp schema.sql remind-test-pg:/schema.sql
docker cp insert.sql remind-test-pg:/insert.sql
# MSYS_NO_PATHCONV=1 needed in Git Bash or the leading "/" paths get
# mangled into a Windows path (psql: error: C:/Program Files/Git/schema.sql).
MSYS_NO_PATHCONV=1 docker exec -u postgres remind-test-pg psql -d remind -f /schema.sql
MSYS_NO_PATHCONV=1 docker exec -u postgres remind-test-pg psql -d remind -f /insert.sql

cd ../
SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5433/remind" ./mvnw.cmd -q spring-boot:run
```

Confirm which DB it actually connected to via the log line
`Database JDBC URL [jdbc:postgresql://localhost:5433/remind]`.

## Gotcha: stale `target/classes` breaks boot with ConflictingBeanDefinitionException

If `spring-boot:run` fails with `ConflictingBeanDefinitionException` for a
bean that looks like it should only exist once, it's very likely a stale
`.class` left in `target/classes` from before a package/file move (this
repo has had at least one file whose declared `package` didn't match its
directory). Fix: `./mvnw.cmd -q -o clean compile` before rerunning.

## Getting a real login/session for a patient account

`api/data/insert.sql` seed users all share one bcrypt hash — the plaintext
isn't recorded anywhere in the repo. Generate your own hash and insert a
fresh test patient rather than guessing:

```java
// throwaway test, delete after running
new BCryptPasswordEncoder().encode("Test@1234")
```

Run it with `./mvnw.cmd test -Dtest=<TestClassName>` (needs network on
first run to fetch the surefire plugin — don't pass `-o`), then:

```sql
INSERT INTO users (name, email, cpf, phone, password, type, profile_complete, created_at, updated_at, active)
VALUES ('QA Patient', 'qa@example.com', '11122233344', '51999998888', '<hash>', 'PATIENT', true, now(), now(), true)
RETURNING id;

INSERT INTO patients (id_user, id_psychologist, birth_date, gender, created_at, updated_at, active)
VALUES (<id>, 1, '2000-01-01', 'F', now(), now(), true); -- id_psychologist=1 is the seeded Camila
```

## Frontend against the local backend

`.env.local` points `API_URL`/`NEXT_PUBLIC_API_URL` at production
(`https://api.remindapp.com.br`). Don't edit it — override via env vars
when launching dev (OS env wins over `.env.local` in Next.js), on an
alternate port so it doesn't collide with anyone else's `next dev`:

```bash
API_URL=http://localhost:8080 NEXT_PUBLIC_API_URL=http://localhost:8080 npx next dev -p 3100
```

## Driving it through the real interface (no browser tool available here)

There's no Playwright/browser MCP tool in this environment. The next best
thing — and still genuine runtime verification, not a unit test — is to
drive the actual HTTP surfaces with `curl` + a cookie jar, going through
Auth.js's real credentials flow (not hitting the Java API directly):

```bash
JAR=/tmp/cookies.txt
CSRF=$(curl -s -c "$JAR" http://localhost:3100/api/auth/csrf | grep -oE '"csrfToken":"[^"]+"' | cut -d'"' -f4)
curl -s -b "$JAR" -c "$JAR" -X POST http://localhost:3100/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=qa@example.com" \
  --data-urlencode "password=Test@1234" \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "json=true"

# now $JAR carries the real httpOnly session cookie:
curl -s -b "$JAR" http://localhost:3100/api/auth/session       # confirm session
curl -s -b "$JAR" http://localhost:3100/paciente/inicio          # SSR page HTML
curl -s -b "$JAR" "http://localhost:3100/api/questionarios"     # BFF proxy (what client components fetch)
```

This exercises: real login, real httpOnly cookie, the BFF proxy attaching
the Bearer token server-side, and SSR page rendering — the same path a
browser takes, just without pixels. Client-only components (anything
`"use client"` that fetches via TanStack Query) won't show their fetched
content in the raw SSR HTML — verify those via the BFF proxy route
directly instead, as above.

## Cleanup

```bash
docker rm -f remind-test-pg
# kill the specific spring-boot:run / next dev PIDs you started — do not
# taskkill by image name (java.exe / node.exe), that can kill unrelated
# processes on a dev machine.
```
