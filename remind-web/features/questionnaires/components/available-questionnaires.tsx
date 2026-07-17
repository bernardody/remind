"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, CheckCircle2, ClipboardList, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useMyInvites } from "@/features/invites/api";
import type { PatientInvite } from "@/features/invites/schemas";
import { ROUTES } from "@/lib/constants";

const PAGE_SIZE = 20;

/**
 * `status` só reflete transições explícitas — expiração é checada dinamicamente contra
 * `expiresAt` (o backend não marca EXPIRED em lote, só recusa o consumo/resposta quando
 * `expires_at` já passou). Ver ConsumeInviteService/AnswerQuestionnaireService no backend.
 */
function isLive(invite: PatientInvite): boolean {
  return (
    (invite.status === "PENDING" || invite.status === "SENT" || invite.status === "OPENED") &&
    new Date(invite.expiresAt).getTime() > Date.now()
  );
}

/**
 * RF-18 — questionários disponíveis pro paciente responder. Lista os próprios convites
 * (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.5/§5.1), não mais o catálogo
 * global de `/questionarios` — o convite passou a ser obrigatório pra responder, inclusive na
 * 1ª vez, então "disponível" agora significa "tenho um convite vivo", não "existe no sistema".
 * O paciente não precisa abrir o link de e-mail pra ver o item aqui: a simples existência do
 * convite já é suficiente (não precisa "aceitar" nada).
 */
export function AvailableQuestionnaires() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useMyInvites({ page, size: PAGE_SIZE });

  const columns: ColumnDef<PatientInvite>[] = [
    {
      accessorKey: "questionnaireTitle",
      header: "Avaliação",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <ClipboardList className="size-3.5" />
          </span>
          <span className="font-medium text-foreground">{row.original.questionnaireTitle}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const invite = row.original;

        if (invite.status === "ANSWERED") {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
              Já respondido
            </span>
          );
        }

        if (!isLive(invite)) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              Indisponível
            </span>
          );
        }

        return (
          <Button size="sm" asChild>
            <Link href={ROUTES.paciente.responder(invite.questionnaireId)}>
              Responder
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        );
      },
    },
  ];

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.content ?? []}
      isLoading={isLoading}
      page={data?.number ?? 0}
      totalPages={data?.totalPages ?? 0}
      isFirst={data?.first ?? true}
      isLast={data?.last ?? true}
      onPageChange={setPage}
      emptyState={
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma avaliação disponível"
          description="Assim que seu psicólogo enviar um convite, ele aparece aqui."
        />
      }
    />
  );
}
