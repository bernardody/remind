"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

interface ConfirmationProps {
  questionnaireTitle: string;
}

/** RF-18 — tela de confirmação, tom calmo e sem atrito (PRD §5). */
export function Confirmation({ questionnaireTitle }: ConfirmationProps) {
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
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.paciente.inicio}>Voltar ao início</Link>
      </Button>
    </div>
  );
}
