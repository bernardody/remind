"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Question } from "@/features/questionnaires/schemas";

interface ReviewStepProps {
  questions: Question[];
  answers: Record<number, number>;
  onEdit: (stepIndex: number) => void;
}

/** RF-18 — revisão antes de enviar, com atalho pra voltar e corrigir qualquer resposta. */
export function ReviewStep({ questions, answers, onEdit }: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Revise suas respostas antes de enviar. Você pode voltar e alterar qualquer uma delas.
      </p>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {questions.map((question, index) => {
          const optionId = answers[question.id];
          const option = question.options.find((o) => o.id === optionId);
          return (
            <div key={question.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Pergunta {index + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{question.text}</span>
                <span className="text-sm text-primary">{option?.name ?? "Não respondida"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onEdit(index)} className="shrink-0">
                <Pencil className="size-3.5" />
                Editar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
