import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** RF-21 — estado vazio padronizado (ensina o próximo passo, não só "nada aqui"). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
