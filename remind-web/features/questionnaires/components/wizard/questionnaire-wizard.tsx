"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  inviteId: number;
}

/** RF-18 — orquestra pergunta-a-passo, revisão e envio; estado vive em `wizard-store.ts`. */
export function QuestionnaireWizard({ questionnaire, inviteId }: QuestionnaireWizardProps) {
  const questions = useMemo(
    () => [...questionnaire.questions].sort((a, b) => a.order_number - b.order_number),
    [questionnaire.questions],
  );

  const { currentStep, answers, start, answer, goNext, goPrev, goToStep, reset } = useWizardStore();
  const answerMutation = useAnswerQuestionnaire(questionnaire.id);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    start(questionnaire.id, inviteId);
  }, [questionnaire.id, inviteId, start]);

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
        // Limpa o progresso persistido (sessionStorage) assim que a resposta é aceita — sem
        // isso, uma reaplicação futura do MESMO questionnaireId (docs/specs/
        // 003-relatorios-evolucao-longitudinal/PRD.md §3) reabre o wizard com as respostas da
        // rodada anterior pré-selecionadas, porque `start()` só reseta quando o id muda.
        onSuccess: () => reset(),
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
        <ProgressBar
          current={Math.min(currentStep, reviewStepIndex)}
          total={reviewStepIndex}
          isReview={isReviewStep}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isReviewStep ? "review" : currentQuestion?.id}
            initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            {isReviewStep ? (
              <ReviewStep questions={questions} answers={answers} onEdit={goToStep} />
            ) : currentQuestion ? (
              <QuestionStep
                question={currentQuestion}
                selectedOptionId={answers[currentQuestion.id]}
                onSelect={(optionId) => answer(currentQuestion.id, optionId)}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

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
