"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { signIn, getSession } from "next-auth/react";

import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

/** Único ponto de checagem da env var — evita duplicar em quem renderiza o botão. */
export const GOOGLE_LOGIN_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * "Continuar com o Google" via Google Identity Services (GSI) — sem SDK
 * cliente adicional, só o script oficial do Google renderizando o próprio
 * botão. O ID token gerado é validado de verdade no backend (spec
 * 001-login-google-psicologo, `POST /login/google`); aqui só repassamos.
 * Só psicólogo com e-mail pré-cadastrado consegue entrar (backend rejeita o
 * resto). Quem renderiza este componente deve checar `GOOGLE_LOGIN_ENABLED`
 * antes (degrade gracioso em dev local sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
 */
export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const result = await signIn("google", {
        idToken: response.credential,
        redirect: false,
      });

      if (!result || result.error) {
        onError(
          result?.code === "server-unavailable"
            ? "Não conseguimos conectar. Tente novamente em instantes."
            : (result?.code ?? "Não foi possível entrar com o Google."),
        );
        return;
      }

      const session = await getSession();
      const type = session?.user.type;
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl ?? (type ? HOME_BY_USER_TYPE[type] : ROUTES.home));
      router.refresh();
    },
    [onError, router, searchParams],
  );

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 336,
      text: "continue_with",
      locale: "pt-BR",
    });
  }, [scriptLoaded, clientId, handleCredential]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} className="flex w-full justify-center" />
    </>
  );
}
