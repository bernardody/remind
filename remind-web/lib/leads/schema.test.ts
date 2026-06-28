import { describe, expect, it } from "vitest";
import { leadSchema } from "./schema";

describe("leadSchema", () => {
  const valido = {
    nome: "Maria Silva",
    email: "maria@clinica.com",
    telefone: "(11) 99999-0000",
  };

  it("aceita um lead mínimo válido", () => {
    const r = leadSchema.safeParse(valido);
    expect(r.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const r = leadSchema.safeParse({ ...valido, email: "invalido" });
    expect(r.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const r = leadSchema.safeParse({ ...valido, nome: "M" });
    expect(r.success).toBe(false);
  });

  it("aceita campos opcionais vazios", () => {
    const r = leadSchema.safeParse({ ...valido, clinica: "", mensagem: "" });
    expect(r.success).toBe(true);
  });
});
