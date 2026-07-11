"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useMyAnsweredQuestionnaires, useQuestionnaires } from "@/features/questionnaires/api";
import type { Questionnaire } from "@/features/questionnaires/schemas";
import { ROUTES } from "@/lib/constants";

const PAGE_SIZE = 20;
// Catálogo de questionários é pequeno — busca tudo numa página só pra montar
// o conjunto de "já respondidos", em vez de sincronizar paginação entre duas listas.
const ANSWERED_LOOKUP_SIZE = 1000;

/**
 * RF-18 — questionários disponíveis pro paciente responder. O backend não
 * escopa "atribuídos a este paciente" (PRD §3 dep. #5), então lista todos os
 * ativos via `/questionarios` sem fingir um status de pendente que não temos
 * dado pra sustentar (ver Spec 04 §5) — mas "já respondido" a gente sabe via
 * `/questionarios/respondidos`, então isso é marcado de verdade.
 */
export function AvailableQuestionnaires() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useQuestionnaires({ page, size: PAGE_SIZE });
  const { data: answered } = useMyAnsweredQuestionnaires({ page: 0, size: ANSWERED_LOOKUP_SIZE });

  const answeredIds = new Set(answered?.content.map((a) => a.questionnaireId) ?? []);

  const columns: ColumnDef<Questionnaire>[] = [
    {
      accessorKey: "title",
      header: "Avaliação",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <ClipboardList className="size-3.5" />
          </span>
          <span className="font-medium text-foreground">{row.original.title}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      enableSorting: false,
      cell: ({ row }) => {
        if (answeredIds.has(row.original.id)) {
          return <span className="text-xs font-medium text-muted-foreground">Já respondido</span>;
        }
        if (!row.original.active) {
          return <span className="text-xs text-muted-foreground">Indisponível</span>;
        }
        return (
          <Button size="sm" asChild>
            <Link href={ROUTES.paciente.responder(row.original.id)}>Responder</Link>
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
          description="Assim que seu psicólogo disponibilizar uma avaliação, ela aparece aqui."
        />
      }
    />
  );
}
