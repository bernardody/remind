"use client";

import { ListChecks } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Question } from "@/features/questionnaires/schemas";

interface QuestionnaireQuestionsDialogProps {
  questions: Question[];
}

/** Botão "Ver perguntas" — mostra as perguntas do questionário agrupadas por escala, com as opções de resposta de cada uma. */
export function QuestionnaireQuestionsDialog({
  questions,
}: QuestionnaireQuestionsDialogProps) {
  const scaleGroups = new Map<string, Question[]>();
  questions.forEach((question) => {
    const group = scaleGroups.get(question.scale.name) ?? [];
    group.push(question);
    scaleGroups.set(question.scale.name, group);
  });
  scaleGroups.forEach((group) => group.sort((a, b) => a.order_number - b.order_number));
  const groups = Array.from(scaleGroups.entries());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ListChecks className="size-4" />
          Ver perguntas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Perguntas do questionário</DialogTitle>
          <DialogDescription>
            {questions.length} pergunta(s) agrupadas por escala, com as opções de resposta.
          </DialogDescription>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={groups.map(([scaleName]) => scaleName)}>
          {groups.map(([scaleName, scaleQuestions]) => (
            <AccordionItem key={scaleName} value={scaleName}>
              <AccordionTrigger>
                <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                  <span>{scaleName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {scaleQuestions.length}{" "}
                    {scaleQuestions.length === 1 ? "pergunta" : "perguntas"}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col divide-y divide-border">
                  {scaleQuestions.map((question, index) => (
                    <div key={question.id} className="flex flex-col gap-2 py-4">
                      <span className="flex items-start gap-3 text-sm text-foreground">
                        <span className="mt-0.5 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {question.text}
                      </span>
                      <div className="ml-7 flex flex-wrap gap-1.5">
                        {question.options.map((option) => (
                          <span
                            key={option.id}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                          >
                            {option.name} · {option.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
