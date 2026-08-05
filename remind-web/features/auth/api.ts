import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

import type {
  ChangePasswordRequest,
  CompleteProfileRequest,
  CompleteProfileResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "./schemas";

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

/** `POST /auth/forgot-password` — tela pública "esqueci minha senha". */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) =>
      apiFetch<void>("/auth/forgot-password", { method: "POST", body }),
  });
}

/** `POST /auth/reset-password` — tela pública de "redefinir senha" (link recebido por e-mail). */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ confirmNewPassword: _confirmNewPassword, ...rest }: ResetPasswordRequest) =>
      apiFetch<void>("/auth/reset-password", { method: "POST", body: rest }),
  });
}

/** `PUT /psychologists/me/password` — troca de senha do psicólogo autenticado (tela de perfil). */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ confirmNewPassword: _confirmNewPassword, ...rest }: ChangePasswordRequest) =>
      apiFetch<void>("/psychologists/me/password", { method: "PUT", body: rest }),
  });
}
