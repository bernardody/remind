"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { usePatientQuestionnaires } from "@/features/patients/api";
import type { PatientQuestionnaire } from "@/features/patients/schemas";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

interface PatientQuestionnairesTableProps {
  patientId: number;
}

/** RF-14/RF-16 — avaliações respondidas por este paciente, com link pro resultado. */
export function PatientQuestionnairesTable({ patientId }: PatientQuestionnairesTableProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = usePatientQuestionnaires(patientId, {
    page,
    size: PAGE_SIZE,
  });

  const columns: ColumnDef<PatientQuestionnaire>[] = [
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
          <Link
            href={`${ROUTES.psicologo.avaliacoes}/${row.original.questionnaireId}/pacientes/${patientId}`}
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
          icon={ClipboardList}
          title="Nenhuma avaliação respondida"
          description="Assim que este paciente responder uma avaliação, ela aparece aqui."
        />
      }
    />
  );
}
