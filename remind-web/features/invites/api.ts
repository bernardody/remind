import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { PageParams } from "@/lib/api/types";

import type { Invite, PatientInvite } from "./schemas";

function patientInvitesKey(patientId: number) {
  return ["patients", patientId, "convites"] as const;
}

export function usePatientInvites(patientId: number, params: PageParams) {
  return useQuery({
    queryKey: [...patientInvitesKey(patientId), params],
    queryFn: () => apiFetchPage<PatientInvite>(`/pacientes/${patientId}/convites`, params),
  });
}

export function useCreateInvite(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionnaireId: number) =>
      apiFetch<Invite>(`/pacientes/${patientId}/questionarios/${questionnaireId}/convites`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientInvitesKey(patientId) });
    },
  });
}

export function useResendInvite(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: number) =>
      apiFetch<Invite>(`/convites/${inviteId}/reenviar`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientInvitesKey(patientId) });
    },
  });
}

export function useRevokeInvite(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: number) => apiFetch<void>(`/convites/${inviteId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientInvitesKey(patientId) });
    },
  });
}

/**
 * Auto-serviço do paciente: seus próprios convites (via JWT, sem `patientId`) — base da tela
 * "Início" (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.5/§5.1).
 */
export function useMyInvites(params: PageParams) {
  return useQuery({
    queryKey: ["convites", "meus", params],
    queryFn: () => apiFetchPage<PatientInvite>("/questionarios/convites", params),
  });
}
