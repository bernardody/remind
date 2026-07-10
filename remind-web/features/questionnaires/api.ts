import { useQuery } from "@tanstack/react-query";

import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { PageParams } from "@/lib/api/types";

import type { Questionnaire, QuestionnaireDetail, QuestionnairePatient } from "./schemas";

export function useQuestionnaires(params: PageParams) {
  return useQuery({
    queryKey: ["questionnaires", params],
    queryFn: () => apiFetchPage<Questionnaire>("/questionarios", params),
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
