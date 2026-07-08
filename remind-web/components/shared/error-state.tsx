"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** RF-21 — estado de erro padronizado, com ação de retry quando aplicável. */
export function ErrorState({
  title = "Não foi possível carregar",
  description = "Tente novamente em instantes.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
