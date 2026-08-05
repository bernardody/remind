import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import type { CreatePsychologistRequest } from "./schemas";

/** `POST /admin/psychologists` — restrito a UserType.ADMIN (ver AdminAuthorizationFilter no backend). */
export function useCreatePsychologist() {
  return useMutation({
    mutationFn: (body: CreatePsychologistRequest) =>
      apiFetch<void>("/admin/psychologists", { method: "POST", body }),
  });
}
