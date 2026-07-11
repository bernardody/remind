"use client";

import type { Question } from "@/features/questionnaires/schemas";
import { cn } from "@/lib/utils";

interface QuestionStepProps {
  question: Question;
  selectedOptionId: number | undefined;
  onSelect: (optionId: number) => void;
}

/** RF-18 — 1 pergunta por passo, opções como cards selecionáveis (sem Radix RadioGroup). */
export function QuestionStep({ question, selectedOptionId, onSelect }: QuestionStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold text-foreground">{question.text}</p>
      <div role="radiogroup" aria-label={question.text} className="flex flex-col gap-2.5">
        {question.options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200",
                isSelected
                  ? "border-primary bg-accent text-primary shadow-soft"
                  : "border-border text-foreground hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  isSelected ? "border-primary bg-primary" : "border-border",
                )}
                aria-hidden="true"
              >
                {isSelected && <span className="size-2 rounded-full bg-primary-foreground" />}
              </span>
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
