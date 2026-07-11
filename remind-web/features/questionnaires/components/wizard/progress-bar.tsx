interface ProgressBarProps {
  /** Passo atual, 0-indexado. */
  current: number;
  total: number;
  /** Passo de revisão não é "pergunta" — rótulo próprio (PRD.md §5.13). */
  isReview?: boolean;
}

export function ProgressBar({ current, total, isReview = false }: ProgressBarProps) {
  const step = Math.min(current + 1, total);
  const percent = total > 0 ? (step / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{isReview ? "Revisão das respostas" : `Pergunta ${step} de ${total}`}</span>
        <span>{isReview ? "Pronta para enviar" : `${Math.round(percent)}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
