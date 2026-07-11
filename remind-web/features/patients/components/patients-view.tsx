"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog";
import { useDeletePatient, usePatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/schemas";
import { ApiError } from "@/lib/api/types";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;
const GENDER_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PatientsView() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  /** `undefined` = fechado · `null` = criar · `Patient` = editar. */
  const [formPatient, setFormPatient] = useState<Patient | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const { data, isLoading, isError, refetch } = usePatients({ page, size: PAGE_SIZE });
  const deletePatient = useDeletePatient();

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.content;
    return data.content.filter(
      (p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term),
    );
  }, [data, search]);

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-primary">
            {initials(row.original.name)}
          </span>
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Telefone" },
    {
      accessorKey: "birthDate",
      header: "Nascimento",
      cell: ({ row }) => formatDate(row.original.birthDate),
    },
    {
      accessorKey: "gender",
      header: "Gênero",
      cell: ({ row }) => GENDER_LABEL[row.original.gender] ?? row.original.gender,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ações do paciente">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`${ROUTES.psicologo.pacientes}/${row.original.id}`}>Ver detalhes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFormPatient(row.original)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteTarget(row.original)}
            >
              Inativar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePatient.mutateAsync(deleteTarget.id);
      toast.success("Paciente inativado.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível inativar o paciente.",
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const emptyStateNode = (
    <EmptyState
      icon={Users}
      title={search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
      description={
        search ? "Ajuste a busca ou limpe o filtro." : "Cadastre o primeiro paciente para começar."
      }
      action={!search && <Button onClick={() => setFormPatient(null)}>Novo paciente</Button>}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Busca filtra apenas os pacientes carregados nesta página.
          </p>
        </div>
        <Button onClick={() => setFormPatient(null)}>
          <Plus className="size-4" />
          Novo paciente
        </Button>
      </div>

      {/* Desktop/tablet: tabela completa. Abaixo de `md`, 7 colunas força scroll
          horizontal ruim numa lista de uso diário — troca por cards (PRD.md §5.5). */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          page={data?.number ?? 0}
          totalPages={data?.totalPages ?? 0}
          isFirst={data?.first ?? true}
          isLast={data?.last ?? true}
          onPageChange={setPage}
          emptyState={emptyStateNode}
        />
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {isLoading ? (
          <LoadingState rows={5} />
        ) : filtered.length === 0 ? (
          emptyStateNode
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {filtered.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <Link
                    href={`${ROUTES.psicologo.pacientes}/${patient.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                      {initials(patient.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {patient.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={patient.active ? "default" : "secondary"}>
                      {patient.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações do paciente">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${ROUTES.psicologo.pacientes}/${patient.id}`}>
                            Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFormPatient(patient)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(patient)}
                        >
                          Inativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {(data?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {(data?.number ?? 0) + 1} de {data?.totalPages ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data?.first ?? true}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data?.last ?? true}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PatientFormDialog
        open={formPatient !== undefined}
        onOpenChange={(open) => !open && setFormPatient(undefined)}
        patient={formPatient ?? null}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} deixa de aparecer como ativo. A ação é reversível apenas pelo
              suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Inativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
