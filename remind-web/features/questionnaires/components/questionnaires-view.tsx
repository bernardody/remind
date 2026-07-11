"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ClipboardList, Info, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useQuestionnaires } from "@/features/questionnaires/api";
import type { Questionnaire, QuestionnairePatient } from "@/features/questionnaires/schemas";
import { apiFetchPage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";

/** Backend não expõe criar/editar/remover questionário para o psicólogo — só leitura. */
export function QuestionnairesView() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<StatusFilter>("all");
  const { data, isLoading, isError, refetch } = useQuestionnaires({ page, size: PAGE_SIZE });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (status === "all") return data.content;
    return data.content.filter((q) => (status === "active" ? q.active : !q.active));
  }, [data, status]);

  // Sem filtro por escala: `/questionarios` (lista) não traz as escalas de
  // cada questionário — só `/questionarios/{id}` (detalhe) tem `questions[].scale`,
  // e buscar o detalhe de cada linha só pra filtrar seria N+1 caro pra um
  // filtro que a lista de hoje (poucas avaliações) não justifica ainda.
  const patientCounts = useQueries({
    queries: filtered.map((questionnaire) => ({
      queryKey: ["questionnaires", questionnaire.id, "pacientes", "count"],
      queryFn: () =>
        apiFetchPage<QuestionnairePatient>(`/questionarios/${questionnaire.id}/pacientes`, {
          size: 1,
        }),
      staleTime: 60 * 1000,
    })),
  });

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
      id: "respondents",
      header: "Respondida por",
      enableSorting: false,
      cell: ({ row }) => {
        const index = filtered.findIndex((q) => q.id === row.original.id);
        const query = patientCounts[index];
        if (!query || query.isLoading) {
          return <span className="text-xs text-muted-foreground">…</span>;
        }
        const count = query.data?.totalElements ?? 0;
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
            <Users className="size-3.5 text-muted-foreground" />
            {count} {count === 1 ? "paciente" : "pacientes"}
          </span>
        );
      },
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
      enableSorting: false,
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

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          Avaliações são cadastradas pela equipe ReMind — sem opção de criar por aqui ainda.
        </p>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
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
    </div>
  );
}
