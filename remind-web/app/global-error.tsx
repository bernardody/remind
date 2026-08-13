"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import "./globals.css";

/**
 * Substitui o layout raiz inteiro (html/body) quando o próprio RootLayout
 * quebra — por isso não usa Providers/Button/Logo, só HTML+Tailwind puro,
 * pra não depender de nada que também possa estar quebrado.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <TriangleAlert className="size-8" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">ReMind</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Algo deu muito errado e não conseguimos carregar a página. Tente
              novamente ou volte ao início.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
            >
              Tentar novamente
            </button>
            {/* <a> proposital: RootLayout já quebrou, então uma navegação
                client-side (Link) reaproveitaria a mesma árvore com defeito;
                um reload completo é o jeito mais seguro de recuperar. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border-2 border-primary px-6 text-base font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
