"use client";

import { useState } from "react";
import { Mail, MoreHorizontal, Send } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { InviteDialog } from "@/features/invites/components/invite-dialog";
import { InviteReadyActions } from "@/features/invites/components/invite-ready-actions";
import { InviteStatusBadge } from "@/features/invites/components/invite-status-badge";
import { usePatientInvites, useResendInvite, useRevokeInvite } from "@/features/invites/api";
import type { Invite, PatientInvite } from "@/features/invites/schemas";
import { ApiError } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;

/** Convites que ainda fazem sentido reenviar/revogar — o resto já é estado terminal. */
function isActionable(status: PatientInvite["status"]) {
  return status !== "ANSWERED" && status !== "REVOKED";
}

function statusDetail(invite: PatientInvite): string {
  if (invite.status === "PENDING" || invite.status === "SENT") {
    return `Expira em ${formatDateTime(invite.expiresAt)}`;
  }
  if (invite.status === "OPENED" && invite.openedAt) {
    return `Aberto em ${formatDateTime(invite.openedAt)}`;
  }
  if (invite.sentAt) {
    return `Enviado em ${formatDateTime(invite.sentAt)}`;
  }
  return "—";
}

interface PatientInvitesSectionProps {
  patientId: number;
  patientName: string;
  patientPhone: string;
}

export function PatientInvitesSection({
  patientId,
  patientName,
  patientPhone,
}: PatientInvitesSectionProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<PatientInvite | null>(null);
  const [resentReady, setResentReady] = useState<{
    invite: Invite;
    questionnaireTitle: string;
  } | null>(null);

  const { data, isLoading, isError, refetch } = usePatientInvites(patientId, {
    size: PAGE_SIZE,
  });
  const resendInvite = useResendInvite(patientId);
  const revokeInvite = useRevokeInvite(patientId);

  async function handleResend(invite: PatientInvite) {
    try {
      const resent = await resendInvite.mutateAsync(invite.id);
      await copyLinkSilently(resent.inviteLink);
      toast.success("Convite reenviado e link copiado.");
      setResentReady({ invite: resent, questionnaireTitle: invite.questionnaireTitle });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível reenviar o convite.",
      );
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    try {
      await revokeInvite.mutateAsync(revokeTarget.id);
      toast.success("Convite revogado.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível revogar o convite.",
      );
    } finally {
      setRevokeTarget(null);
    }
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const invites = data?.content ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Convites</h2>
        <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
          <Send className="size-4" />
          Convidar
        </Button>
      </div>

      {isLoading ? (
        <LoadingState rows={2} />
      ) : invites.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum convite enviado ainda"
          description="Convide o paciente a responder um questionário por e-mail, sem precisar de senha."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {invite.questionnaireTitle}
                </p>
                <p className="text-xs text-muted-foreground">{statusDetail(invite)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <InviteStatusBadge status={invite.status} />
                {isActionable(invite.status) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações do convite">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleResend(invite)}>
                        Reenviar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setRevokeTarget(invite)}
                      >
                        Revogar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        patientId={patientId}
        patientName={patientName}
        patientPhone={patientPhone}
      />

      <Dialog open={!!resentReady} onOpenChange={(open) => !open && setResentReady(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convite reenviado</DialogTitle>
            <DialogDescription>
              O e-mail já foi enviado de novo. Envie também por WhatsApp ou copie o link.
            </DialogDescription>
          </DialogHeader>
          {resentReady && (
            <InviteReadyActions
              patientName={patientName}
              patientPhone={patientPhone}
              questionnaireTitle={resentReady.questionnaireTitle}
              inviteLink={resentReady.invite.inviteLink}
              expiresAt={resentReady.invite.expiresAt}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setResentReady(null)}>
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O link enviado para &ldquo;{revokeTarget?.questionnaireTitle}&rdquo; deixa de
              funcionar imediatamente. Dá pra convidar de novo depois, se precisar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

async function copyLinkSilently(link: string) {
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // sem-op — o reenvio de e-mail já aconteceu, cópia é só conveniência.
  }
}
