"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useQuestionnaires } from "@/features/questionnaires/api";
import type { Questionnaire } from "@/features/questionnaires/schemas";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const columns: ColumnDef<Questionnaire>[] = [
  {
    accessorKey: "title",
    header: "Título",
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
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    accessorKey: "updated_at",
    header: "Atualizado em",
    cell: ({ row }) => formatDate(row.original.updated_at),
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Ações</span>,
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" className="group" asChild>
        <Link href={`${ROUTES.psicologo.avaliacoes}/${row.original.id}`}>
          Ver respostas
          <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Button>
    ),
  },
];

/** Backend não expõe criar/editar/remover questionário para o psicólogo — só leitura. */
export function QuestionnairesView() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useQuestionnaires({ page, size: PAGE_SIZE });

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
          description="As avaliações aparecem aqui assim que forem cadastradas no sistema."
        />
      }
    />
  );
}
