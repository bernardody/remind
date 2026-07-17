import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { PageParams } from "@/lib/api/types";

import type {
  InsertPatientRequest,
  Patient,
  PatientQuestionnaire,
  UpdatePatientRequest,
} from "./schemas";

const PATIENTS_KEY = ["patients"] as const;

export function usePatients(params: PageParams) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, params],
    queryFn: () => apiFetchPage<Patient>("/pacientes", params),
  });
}

export function usePatientQuestionnaires(
  id: number,
  params: PageParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, id, "avaliacoes", params],
    queryFn: () => apiFetchPage<PatientQuestionnaire>(`/pacientes/${id}/avaliacoes`, params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertPatientRequest) =>
      apiFetch<Patient>("/pacientes", { method: "POST", body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATIENTS_KEY });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePatientRequest }) =>
      apiFetch<Patient>(`/pacientes/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATIENTS_KEY });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/pacientes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATIENTS_KEY });
    },
  });
}
