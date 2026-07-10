"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePatient, useUpdatePatient } from "@/features/patients/api";
import {
  InsertPatientRequestSchema,
  UpdatePatientRequestSchema,
  type InsertPatientRequest,
  type Patient,
  type UpdatePatientRequest,
} from "@/features/patients/schemas";
import { ApiError } from "@/lib/api/types";

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = criar paciente novo; um `Patient` = editar. */
  patient: Patient | null;
}

/** Gênero é `Character` livre no backend (não um enum) — M/F cobrem o cadastro atual. */
const GENDER_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
];

/** Um único dialog: cria quando `patient` é `null`, edita quando é passado. */
export function PatientFormDialog({ open, onOpenChange, patient }: PatientFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{patient ? "Editar paciente" : "Novo paciente"}</DialogTitle>
          <DialogDescription>
            {patient
              ? "Nome, telefone, nascimento e gênero podem ser alterados. Email e senha são fixos após o cadastro."
              : "Cadastre um novo paciente para aplicar questionários."}
          </DialogDescription>
        </DialogHeader>
        {patient ? (
          <EditPatientForm patient={patient} onDone={() => onOpenChange(false)} />
        ) : (
          <CreatePatientForm onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatePatientForm({ onDone }: { onDone: () => void }) {
  const createPatient = useCreatePatient();
  const form = useForm<InsertPatientRequest>({
    resolver: zodResolver(InsertPatientRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      birthDate: "",
      gender: "",
    },
  });

  async function onSubmit(values: InsertPatientRequest) {
    try {
      await createPatient.mutateAsync(values);
      toast.success("Paciente cadastrado.");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível cadastrar o paciente.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditPatientForm({ patient, onDone }: { patient: Patient; onDone: () => void }) {
  const updatePatient = useUpdatePatient();
  const form = useForm<UpdatePatientRequest>({
    resolver: zodResolver(UpdatePatientRequestSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
      birthDate: patient.birthDate,
      gender: patient.gender,
    },
  });

  async function onSubmit(values: UpdatePatientRequest) {
    try {
      await updatePatient.mutateAsync({ id: patient.id, data: values });
      toast.success("Paciente atualizado.");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível atualizar o paciente.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">Email (fixo)</span>
          <span className="text-sm font-medium text-foreground">{patient.email}</span>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
