"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InviteReadyActions } from "@/features/invites/components/invite-ready-actions";
import { useCreateInvite } from "@/features/invites/api";
import type { Invite } from "@/features/invites/schemas";
import { useQuestionnaires } from "@/features/questionnaires/api";
import { ApiError } from "@/lib/api/types";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  patientName: string;
  patientPhone: string;
}

const QUESTIONNAIRE_PAGE_SIZE = 100;

export function InviteDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientPhone,
}: InviteDialogProps) {
  const [questionnaireId, setQuestionnaireId] = useState("");
  const [readyInvite, setReadyInvite] = useState<Invite | null>(null);
  const { data: questionnaires, isLoading } = useQuestionnaires({
    size: QUESTIONNAIRE_PAGE_SIZE,
  });
  const createInvite = useCreateInvite(patientId);

  const selectedTitle = questionnaires?.content.find(
    (q) => String(q.id) === questionnaireId,
  )?.title;

  function reset() {
    setQuestionnaireId("");
    setReadyInvite(null);
  }

  async function handleSubmit() {
    if (!questionnaireId) return;

    try {
      const invite = await createInvite.mutateAsync(Number(questionnaireId));
      await copyLinkSilently(invite.inviteLink);
      toast.success("Convite enviado por e-mail e link copiado.");
      setReadyInvite(invite);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível criar o convite.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {readyInvite ? "Convite pronto" : "Convidar para responder"}
          </DialogTitle>
          <DialogDescription>
            {readyInvite
              ? "O e-mail já foi enviado. Envie também por WhatsApp ou copie o link."
              : "O paciente recebe um e-mail com um link direto para responder — sem precisar entrar com senha."}
          </DialogDescription>
        </DialogHeader>

        {readyInvite ? (
          <>
            <InviteReadyActions
              patientName={patientName}
              patientPhone={patientPhone}
              questionnaireTitle={selectedTitle ?? ""}
              inviteLink={readyInvite.inviteLink}
              expiresAt={readyInvite.expiresAt}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
              >
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="invite-questionnaire"
                className="text-sm font-medium text-foreground"
              >
                Questionário
              </label>
              <Select
                value={questionnaireId}
                onValueChange={setQuestionnaireId}
                disabled={isLoading}
              >
                <SelectTrigger id="invite-questionnaire" className="w-full">
                  <SelectValue
                    placeholder={isLoading ? "Carregando…" : "Selecione um questionário"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {questionnaires?.content.map((questionnaire) => (
                    <SelectItem key={questionnaire.id} value={String(questionnaire.id)}>
                      {questionnaire.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!questionnaireId || createInvite.isPending}
              >
                {createInvite.isPending && <Loader2 className="size-4 animate-spin" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function copyLinkSilently(link: string) {
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // sem-op
  }
}
