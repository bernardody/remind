import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import type { CompleteProfileRequest, CompleteProfileResponse } from "./schemas";

/** `PUT /psychologists/me/profile` (spec 001-login-google-psicologo). */
export function useCompleteProfile() {
  return useMutation({
    mutationFn: ({ number, ...rest }: CompleteProfileRequest) =>
      apiFetch<CompleteProfileResponse>("/psychologists/me/profile", {
        method: "PUT",
        body: { ...rest, number: Number(number) },
      }),
  });
}
