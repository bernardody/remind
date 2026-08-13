import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPageAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

interface ErrorPageProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction: ErrorPageAction;
  secondaryAction?: { label: string; href: string };
  /** Tela cheia (usado no not-found.tsx raiz, fora de qualquer layout com header). */
  fullScreen?: boolean;
}

/** Tela de erro/404 de página inteira — usada por error.tsx e not-found.tsx de cada portal. */
export function ErrorPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  fullScreen = false,
}: ErrorPageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 px-6 py-16 text-center",
        fullScreen ? "min-h-screen" : "min-h-[60vh]",
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Icon className="size-8" />
      </span>
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {primaryAction.href ? (
          <Button asChild>
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        ) : (
          <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
        )}
        {secondaryAction && (
          <Button variant="outline" asChild>
            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
