import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import type { PatientAnswers, PatientResult } from "./schemas";

export function usePatientAnswers(questionnaireId: number, patientId: number) {
  return useQuery({
    queryKey: ["questionnaires", questionnaireId, "pacientes", patientId, "respostas"],
    queryFn: () =>
      apiFetch<PatientAnswers>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/respostas`,
      ),
  });
}

export function usePatientResult(questionnaireId: number, patientId: number) {
  return useQuery({
    queryKey: ["questionnaires", questionnaireId, "pacientes", patientId, "resultado"],
    queryFn: () =>
      apiFetch<PatientResult>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/resultado`,
      ),
  });
}

/** RF-19 — auto-serviço do paciente: seu próprio resultado (via JWT, sem `patientId`). */
export function useMyQuestionnaireResult(questionnaireId: number) {
  return useQuery({
    queryKey: ["questionnaires", questionnaireId, "resultado"],
    queryFn: () => apiFetch<PatientResult>(`/questionarios/${questionnaireId}/resultado`),
  });
}
