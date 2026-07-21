"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

interface ConfirmationProps {
  questionnaireTitle: string;
  /**
   * Sessão nascida de um convite (escopo restrito a este questionário, PRD
   * docs/specs/002-convite-questionario §16/§20) — o backend bloqueia (403)
   * qualquer rota fora do escopo, incluindo `/questionarios/convites` (usada
   * por `/paciente/inicio`). Sem esse flag, o botão "Voltar ao início" levava
   * 100% dos pacientes convidados a um 403 em loop logo após enviar as
   * respostas (a única ação disponível na tela).
   */
  restricted?: boolean;
}

/** RF-18 — tela de confirmação, tom calmo e sem atrito (PRD §5). */
export function Confirmation({ questionnaireTitle, restricted = false }: ConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-primary">
        <CheckCircle2 className="size-8" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Respostas enviadas</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Obrigado por responder &ldquo;{questionnaireTitle}&rdquo;. Seu psicólogo já pode
          acompanhar o resultado.
          {restricted && " Você já pode fechar esta página."}
        </p>
      </div>
      {!restricted && (
        <Button asChild>
          <Link href={ROUTES.paciente.inicio}>Voltar ao início</Link>
        </Button>
      )}
    </div>
  );
}
