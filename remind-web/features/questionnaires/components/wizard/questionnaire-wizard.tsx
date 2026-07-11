"use client";

import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAnswerQuestionnaire } from "@/features/questionnaires/api";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { useWizardStore } from "@/stores/wizard-store";

import { Confirmation } from "./confirmation";
import { ProgressBar } from "./progress-bar";
import { QuestionStep } from "./question-step";
import { ReviewStep } from "./review-step";

interface QuestionnaireWizardProps {
  questionnaire: QuestionnaireDetail;
}

/** RF-18 — orquestra pergunta-a-passo, revisão e envio; estado vive em `wizard-store.ts`. */
export function QuestionnaireWizard({ questionnaire }: QuestionnaireWizardProps) {
  const questions = useMemo(
    () => [...questionnaire.questions].sort((a, b) => a.order_number - b.order_number),
    [questionnaire.questions],
  );

  const { currentStep, answers, start, answer, goNext, goPrev, goToStep } = useWizardStore();
  const answerMutation = useAnswerQuestionnaire(questionnaire.id);

  useEffect(() => {
    start(questionnaire.id);
  }, [questionnaire.id, start]);

  const reviewStepIndex = questions.length;
  const isReviewStep = currentStep === reviewStepIndex;
  const currentQuestion = isReviewStep ? undefined : questions[currentStep];
  const isCurrentAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function handleSubmit() {
    const responses = questions.map((question) => ({
      questionId: question.id,
      questionOptionId: answers[question.id],
    }));

    answerMutation.mutate(
      { responses },
      {
        onError: () => toast.error("Não foi possível enviar suas respostas. Tente novamente."),
      },
    );
  }

  if (answerMutation.isSuccess) {
    return (
      <Card>
        <CardContent>
          <Confirmation questionnaireTitle={questionnaire.title} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 py-6">
        <ProgressBar current={Math.min(currentStep, reviewStepIndex)} total={reviewStepIndex} />

        {isReviewStep ? (
          <ReviewStep questions={questions} answers={answers} onEdit={goToStep} />
        ) : currentQuestion ? (
          <QuestionStep
            question={currentQuestion}
            selectedOptionId={answers[currentQuestion.id]}
            onSelect={(optionId) => answer(currentQuestion.id, optionId)}
          />
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-5">
          <Button variant="outline" onClick={goPrev} disabled={currentStep === 0}>
            <ChevronLeft className="size-4" />
            Voltar
          </Button>

          {isReviewStep ? (
            <Button onClick={handleSubmit} disabled={!allAnswered || answerMutation.isPending}>
              {answerMutation.isPending ? "Enviando..." : "Enviar respostas"}
              <Send className="size-4" />
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!isCurrentAnswered}>
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
