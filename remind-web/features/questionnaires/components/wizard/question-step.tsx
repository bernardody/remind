"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import type { Question } from "@/features/questionnaires/schemas";
import { cn } from "@/lib/utils";

interface QuestionStepProps {
  question: Question;
  selectedOptionId: number | undefined;
  onSelect: (optionId: number) => void;
}

/**
 * RF-18 — 1 pergunta por passo, opções como cards selecionáveis. Usa o Radix
 * `RadioGroup` diretamente (não o `components/ui/radio-group.tsx` genérico,
 * que é o círculo pequeno padrão) porque o card inteiro precisa ser o alvo
 * clicável — dá navegação por seta (↑↓) nativa, que o `<button role="radio">`
 * manual anterior não tinha (PRD.md §2.2/§4.20).
 */
export function QuestionStep({ question, selectedOptionId, onSelect }: QuestionStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-lg font-semibold text-foreground">{question.text}</p>
      <RadioGroupPrimitive.Root
        aria-label={question.text}
        className="flex flex-col gap-2.5"
        value={selectedOptionId !== undefined ? String(selectedOptionId) : undefined}
        onValueChange={(value) => onSelect(Number(value))}
      >
        {question.options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          return (
            <RadioGroupPrimitive.Item
              key={option.id}
              value={String(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
                <RadioGroupPrimitive.Indicator forceMount asChild>
                  <span
                    className={cn(
                      "size-2 rounded-full bg-primary-foreground transition-opacity duration-150",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </RadioGroupPrimitive.Indicator>
              </span>
              {option.name}
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>
    </div>
  );
}
