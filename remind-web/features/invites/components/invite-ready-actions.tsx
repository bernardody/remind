"use client";

import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildWhatsAppInviteLink } from "@/features/invites/lib/whatsapp";

interface InviteReadyActionsProps {
  patientName: string;
  patientPhone: string;
  questionnaireTitle: string;
  inviteLink: string;
  expiresAt: string;
}

/**
 * Ações sobre um convite recém-criado/reenviado — o link só existe neste
 * momento (nunca é reexposto depois, PRD §16), por isso ficam juntas aqui em
 * vez de um botão permanente na listagem.
 */
export function InviteReadyActions({
  patientName,
  patientPhone,
  questionnaireTitle,
  inviteLink,
  expiresAt,
}: InviteReadyActionsProps) {
  function handleWhatsApp() {
    const link = buildWhatsAppInviteLink({
      patientName,
      patientPhone,
      questionnaireTitle,
      inviteLink,
      expiresAt,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleWhatsApp} className="w-full">
        <MessageCircle className="size-4" />
        Enviar por WhatsApp
      </Button>
      <Button type="button" variant="outline" onClick={handleCopy} className="w-full">
        <Copy className="size-4" />
        Copiar link
      </Button>
    </div>
  );
}
