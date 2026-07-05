import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center rounded-full bg-secondary/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-balance text-3xl font-bold tracking-tight sm:text-4xl",
          align === "center" && "max-w-3xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg",
            align === "center" && "max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
