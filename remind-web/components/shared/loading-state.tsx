import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

/** RF-21 — skeleton padronizado para listas/cards em carregamento. */
export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn("flex flex-col gap-3", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
