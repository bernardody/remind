"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useQuestionnairePatients } from "@/features/questionnaires/api";
import type { QuestionnairePatient } from "@/features/questionnaires/schemas";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

interface QuestionnairePatientsTableProps {
  questionnaireId: number;
}

/** RF-15/RF-16 — quem respondeu um questionário, com link pro resultado. */
export function QuestionnairePatientsTable({
  questionnaireId,
}: QuestionnairePatientsTableProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useQuestionnairePatients(questionnaireId, {
    page,
    size: PAGE_SIZE,
  });

  const columns: ColumnDef<QuestionnairePatient>[] = [
    { accessorKey: "patientName", header: "Paciente" },
    {
      accessorKey: "answeredAt",
      header: "Respondido em",
      cell: ({ row }) => formatDateTime(row.original.answeredAt),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="group" asChild>
          <Link
            href={`${ROUTES.psicologo.avaliacoes}/${questionnaireId}/pacientes/${row.original.patientId}`}
          >
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
          icon={Users}
          title="Ninguém respondeu ainda"
          description="Assim que um paciente responder este questionário, ele aparece aqui."
        />
      }
    />
  );
}
