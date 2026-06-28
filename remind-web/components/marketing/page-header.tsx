import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
}

/** Cabeçalho padrão das páginas institucionais (offset do header fixo). */
export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <section className="border-b border-border bg-muted/30 pt-28 pb-12 sm:pt-32 sm:pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
