import { z } from "zod";

/** `POST /admin/psychologists` — cadastro de psicólogo pelo admin (substitui INSERT manual). */
export const CreatePsychologistRequestSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
});
export type CreatePsychologistRequest = z.infer<typeof CreatePsychologistRequestSchema>;
