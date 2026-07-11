import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  LoginRequestSchema,
  LoginResponseSchema,
} from "@/features/auth/schemas";

/**
 * `code` chega ao cliente via `result.code` do `signIn()` (com `redirect:
 * false`) — permite `login-form.tsx` diferenciar "servidor indisponível" de
 * "credencial errada" sem nunca revelar se o email existe (PRD.md §5.3).
 */
class ServerUnavailableError extends CredentialsSignin {
  code = "server-unavailable";
}

// Tipos de Session/User/JWT aumentados em `types/next-auth.d.ts`.

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

/**
 * Payload de um JWT (RS256) sem verificar assinatura — seguro aqui porque o
 * token acabou de ser emitido pelo próprio backend nesta mesma chamada
 * server-side. Usado só para exibição (nome/email); nunca para autorização
 * (isso vem do campo `type` da resposta de `/login`).
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return {};
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    // Alinhado ao expiresIn real do backend (10min) — sem refresh (PRD R1).
    maxAge: 600,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginRequestSchema.safeParse(credentials);
        if (!parsed.success) return null;

        let res: Response;
        try {
          res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
        } catch {
          // Rede/backend fora do ar — não é o usuário que errou a senha.
          throw new ServerUnavailableError();
        }

        // R6 corrigido no backend (05-spec-login-google.md): credencial
        // errada já retorna 401 real. Um 5xx aqui é falha do próprio
        // backend, tratado como caso separado (não "credenciais inválidas").
        if (res.status >= 500) throw new ServerUnavailableError();
        if (!res.ok) return null;

        const json = await res.json().catch(() => null);
        const body = LoginResponseSchema.safeParse(json);
        if (!body.success) return null;

        // O JWT real do backend não tem claim `name` separado — `sub` É o
        // nome do usuário (não um id). `email` é o único identificador
        // estável disponível, por isso vira `id`.
        const claims = decodeJwtPayload(body.data.accessToken);
        return {
          id: parsed.data.email,
          email: (claims.email as string | undefined) ?? parsed.data.email,
          name: claims.sub as string | undefined,
          accessToken: body.data.accessToken,
          type: body.data.type,
          expiresIn: body.data.expiresIn,
          profileComplete: body.data.profileComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.userType = user.type;
        token.expiresAt = Date.now() + user.expiresIn * 1000;
        token.profileComplete = user.profileComplete;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken ?? "";
      session.expiresAt = token.expiresAt ?? 0;
      session.user.type = token.userType ?? "PATIENT";
      session.user.profileComplete = token.profileComplete ?? true;
      return session;
    },
  },
});
