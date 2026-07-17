import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { PageParams } from "@/lib/api/types";

import type {
  AnswerQuestionnaireRequest,
  AnswerQuestionnaireResponse,
  Questionnaire,
  QuestionnaireDetail,
  QuestionnairePatient,
} from "./schemas";

export function useQuestionnaires(params: PageParams) {
  return useQuery({
    queryKey: ["questionnaires", params],
    queryFn: () => apiFetchPage<Questionnaire>("/questionarios", params),
  });
}

/** RF-18 — wizard de resposta (`stores/wizard-store.ts` monta o body). */
export function useAnswerQuestionnaire(questionnaireId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnswerQuestionnaireRequest) =>
      apiFetch<AnswerQuestionnaireResponse>(`/questionarios/${questionnaireId}/responder`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      // Tela "Início" lista pelos próprios convites (docs/specs/
      // 003-relatorios-evolucao-longitudinal/PRD.md §5.1) — invalida essa chave, não mais
      // "/questionarios/respondidos", pra refletir o convite recém-consumido (status ANSWERED).
      void queryClient.invalidateQueries({ queryKey: ["convites", "meus"] });
    },
  });
}

export function useQuestionnaire(id: number) {
  return useQuery({
    queryKey: ["questionnaires", id],
    queryFn: () => apiFetch<QuestionnaireDetail>(`/questionarios/${id}`),
  });
}

export function useQuestionnairePatients(id: number, params: PageParams) {
  return useQuery({
    queryKey: ["questionnaires", id, "pacientes", params],
    queryFn: () =>
      apiFetchPage<QuestionnairePatient>(`/questionarios/${id}/pacientes`, params),
  });
}
