import { z } from "zod";

/**
 * Contrato real de `POST /login` (Spec 04 §0). Sem refresh token, sem `/me`:
 * `type` decide o redirecionamento e o escopo de navegação do usuário.
 */
export const UserTypeSchema = z.enum(["PSYCHOLOGIST", "PATIENT", "ADMIN"]);
export type UserType = z.infer<typeof UserTypeSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("Informe um email válido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  type: UserTypeSchema,
  // Login Google do psicólogo (spec 001-login-google-psicologo, backend):
  // conta criada via Google nasce com perfil incompleto — demais endpoints
  // retornam 403 até a conclusão (fora do escopo desta spec por ora).
  profileComplete: z.boolean().default(true),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Aceita digitar com ou sem pontuação, envia só dígitos (mesmo padrão de
// features/patients/schemas.ts) — colunas `cpf`/`phone` em `users` são
// VARCHAR(11).
const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 11, "CPF inválido");

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido");

/**
 * `PUT /psychologists/me/profile` (spec 001-login-google-psicologo,
 * `CompleteProfileRequest` real) — conclui o perfil de uma conta criada via
 * Google (CPF/telefone/endereço ainda ausentes).
 */
export const CompleteProfileRequestSchema = z.object({
  cpf: cpfSchema,
  phone: phoneSchema,
  street: z.string().min(1, "Informe a rua"),
  // Mantido como string (mesmo padrão de cpf/phone/cep) pra não brigar com o
  // tipo de `useForm` — convertido pra number só na hora de montar o body
  // (`features/auth/api.ts`), já que `CompleteProfileRequest` no backend
  // espera `Integer`.
  number: z.string().regex(/^\d+$/, "Informe o número"),
  cep: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "CEP inválido"),
  neighborhood: z.string().min(1, "Informe o bairro"),
  city: z.string().min(1, "Informe a cidade"),
});
export type CompleteProfileRequest = z.infer<typeof CompleteProfileRequestSchema>;

export const CompleteProfileResponseSchema = z.object({
  profileComplete: z.boolean(),
});
export type CompleteProfileResponse = z.infer<typeof CompleteProfileResponseSchema>;

/** `POST /auth/forgot-password` — sempre 200, exista ou não o e-mail (nunca revela contas). */
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Informe um email válido"),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

const newPasswordSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres");

/** `POST /auth/reset-password` — `token` vem da URL (`?token=`), não é digitado pelo usuário. */
export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * `PUT /psychologists/me/password` — `currentPassword` fica opcional no schema porque a conta
 * pode ainda não ter senha (login Google, ou recém-ativada), mas o form normalmente exige o
 * preenchimento (ver `change-password-form.tsx`).
 */
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
