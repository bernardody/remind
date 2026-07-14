import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  LoginRequestSchema,
  LoginResponseSchema,
} from "@/features/auth/schemas";
import { ConsumeInviteResponseSchema } from "@/features/invites/schemas";

/**
 * `code` chega ao cliente via `result.code` do `signIn()` (com `redirect:
 * false`) — permite `login-form.tsx` diferenciar "servidor indisponível" de
 * "credencial errada" sem nunca revelar se o email existe (PRD.md §5.3).
 */
class ServerUnavailableError extends CredentialsSignin {
  code = "server-unavailable";
}

/**
 * `code` carrega a mensagem real do backend (docs/specs/002-convite-questionario
 * §15 — "link expirado", "já foi utilizado" etc.) — diferente do login, aqui
 * não há razão de segurança pra genericizar a mensagem (não revela nada sobre
 * contas, só sobre o estado de um token que o próprio paciente recebeu).
 */
class InviteConsumeError extends CredentialsSignin {
  constructor(public code: string) {
    super();
  }
}

/**
 * `code` carrega a mensagem real do backend (spec 001-login-google-psicologo
 * §Caminhos alternativos — "e-mail não verificado", "apenas psicólogos", "e-mail
 * ainda não tem acesso liberado"). Diferente do login por senha, aqui não há
 * razão de segurança pra genericizar: o e-mail já veio verificado pelo próprio
 * Google, então a mensagem não revela nada que a pessoa não soubesse.
 */
class GoogleLoginError extends CredentialsSignin {
  constructor(public code: string) {
    super();
  }
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
    // Consome um convite de questionário (docs/specs/002-convite-questionario) e
    // estabelece uma sessão de paciente de escopo restrito — reaproveita 100%
    // do wizard/middleware existentes (o backend já limita o que esse JWT
    // autoriza via `InviteScopedAuthorizationFilter`, independente do que o
    // Next perceba como "sessão de paciente válida").
    Credentials({
      id: "invite",
      credentials: { token: {} },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token : "";
        if (!token) return null;

        let res: Response;
        try {
          res = await fetch(`${API_URL}/convites/consumir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch {
          throw new ServerUnavailableError();
        }

        if (res.status >= 500) throw new ServerUnavailableError();

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            json && typeof json === "object" && "message" in json &&
            typeof (json as Record<string, unknown>).message === "string"
              ? ((json as Record<string, unknown>).message as string)
              : "Não foi possível validar o convite.";
          throw new InviteConsumeError(message);
        }

        const body = ConsumeInviteResponseSchema.safeParse(json);
        if (!body.success) return null;

        const claims = decodeJwtPayload(body.data.accessToken);
        return {
          id: (claims.email as string | undefined) ?? `invite-${body.data.questionnaireId}`,
          email: claims.email as string | undefined,
          name: claims.sub as string | undefined,
          accessToken: body.data.accessToken,
          type: "PATIENT",
          expiresIn: body.data.expiresIn,
          profileComplete: true,
          questionnaireId: body.data.questionnaireId,
          questionnaireTitle: body.data.questionnaireTitle,
        };
      },
    }),
    // Login de psicólogo via Google (docs/specs/001-login-google-psicologo) — o
    // ID token vem do botão Google Identity Services no client
    // (google-sign-in-button.tsx) e é validado de verdade pelo backend em
    // POST /login/google (assinatura, emissor, audiência, email_verified). O
    // e-mail precisa já existir como psicólogo cadastrado (REQ-006, revertido
    // em 2026-07-13); e-mail desconhecido ou de paciente é rejeitado (403).
    Credentials({
      id: "google",
      credentials: { idToken: {} },
      async authorize(credentials) {
        const idToken = typeof credentials?.idToken === "string" ? credentials.idToken : "";
        if (!idToken) return null;

        let res: Response;
        try {
          res = await fetch(`${API_URL}/login/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        } catch {
          throw new ServerUnavailableError();
        }

        if (res.status >= 500) throw new ServerUnavailableError();

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            json && typeof json === "object" && "message" in json &&
            typeof (json as Record<string, unknown>).message === "string"
              ? ((json as Record<string, unknown>).message as string)
              : "Não foi possível entrar com o Google.";
          throw new GoogleLoginError(message);
        }

        const body = LoginResponseSchema.safeParse(json);
        if (!body.success) return null;

        const claims = decodeJwtPayload(body.data.accessToken);
        return {
          id: (claims.email as string | undefined) ?? "google-user",
          email: claims.email as string | undefined,
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
        token.questionnaireId = user.questionnaireId;
        token.questionnaireTitle = user.questionnaireTitle;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken ?? "";
      session.expiresAt = token.expiresAt ?? 0;
      session.user.type = token.userType ?? "PATIENT";
      session.user.profileComplete = token.profileComplete ?? true;
      session.user.questionnaireId = token.questionnaireId;
      session.user.questionnaireTitle = token.questionnaireTitle;
      return session;
    },
  },
});
