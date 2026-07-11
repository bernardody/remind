"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
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
      header: "",
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
              Remover
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
      toast.success("Paciente removido.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível remover o paciente.",
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

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
          <p className="mt-1.5 text-xs text-muted-foreground">
            Busca filtra apenas os pacientes carregados nesta página.
          </p>
        </div>
        <Button onClick={() => setFormPatient(null)}>
          <Plus className="size-4" />
          Novo paciente
        </Button>
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
            icon={Users}
            title={search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            description={
              search
                ? "Ajuste a busca ou limpe o filtro."
                : "Cadastre o primeiro paciente para começar."
            }
            action={
              !search && <Button onClick={() => setFormPatient(null)}>Novo paciente</Button>
            }
          />
        }
      />

      <PatientFormDialog
        open={formPatient !== undefined}
        onOpenChange={(open) => !open && setFormPatient(undefined)}
        patient={formPatient ?? null}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} deixa de aparecer como ativo. A ação é reversível apenas pelo
              suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
