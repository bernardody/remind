import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import type { PatientAnswers, PatientEvolution, PatientResult } from "./schemas";

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

/** Histórico completo de aplicações — fonte de dados da tela de relatórios (Fase 5b). */
export function usePatientEvolution(questionnaireId: number, patientId: number) {
  return useQuery({
    queryKey: ["questionnaires", questionnaireId, "pacientes", patientId, "evolucao"],
    queryFn: () =>
      apiFetch<PatientEvolution>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/evolucao`,
      ),
    enabled: Boolean(questionnaireId) && Boolean(patientId),
  });
}
