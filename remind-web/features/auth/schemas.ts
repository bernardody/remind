import { z } from "zod";

/**
 * Contrato real de `POST /login` (Spec 04 §0). Sem refresh token, sem `/me`:
 * `type` decide o redirecionamento e o escopo de navegação do usuário.
 */
export const UserTypeSchema = z.enum(["PSYCHOLOGIST", "PATIENT"]);
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
