"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useMyAnsweredQuestionnaires } from "@/features/questionnaires/api";
import type { MyAnsweredQuestionnaire } from "@/features/questionnaires/schemas";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

/** RF-19 — histórico próprio do paciente, com link pro resultado individual. */
export function MyAnsweredQuestionnaires() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useMyAnsweredQuestionnaires({
    page,
    size: PAGE_SIZE,
  });

  const columns: ColumnDef<MyAnsweredQuestionnaire>[] = [
    { accessorKey: "questionnaireTitle", header: "Avaliação" },
    {
      accessorKey: "answeredAt",
      header: "Respondido em",
      cell: ({ row }) => formatDateTime(row.original.answeredAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="group" asChild>
          <Link href={ROUTES.paciente.resultadoDetalhe(row.original.questionnaireId)}>
            Ver resultado
            <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      ),
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
          icon={LineChart}
          title="Nenhuma avaliação respondida ainda"
          description="Assim que você responder uma avaliação, o resultado aparece aqui."
        />
      }
    />
  );
}
