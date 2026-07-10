import Link from "next/link";
import { ChevronRight, ClipboardList, Users, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { Patient } from "@/features/patients/schemas";
import type { Questionnaire } from "@/features/questionnaires/schemas";
import { apiFetch } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

interface OverviewCard {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
}

export default async function PsicologoDashboardPage() {
  const session = await requireRole("PSYCHOLOGIST");
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  // Só contagens agregadas (`totalElements`) — o backend não tem endpoint de
  // "avaliações recentes" nem de "pacientes ativos"; nada além disso é inventado aqui.
  const [patients, questionnaires] = await Promise.all([
    apiFetch<Page<Patient>>("/pacientes", {
      params: { size: 1 },
      token: session.accessToken,
    }),
    apiFetch<Page<Questionnaire>>("/questionarios", {
      params: { size: 1 },
      token: session.accessToken,
    }),
  ]);

  const cards: OverviewCard[] = [
    {
      label: "Pacientes cadastrados",
      value: patients.totalElements,
      icon: Users,
      href: ROUTES.psicologo.pacientes,
    },
    {
      label: "Avaliações disponíveis",
      value: questionnaires.totalElements,
      icon: ClipboardList,
      href: ROUTES.psicologo.avaliacoes,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          firstName
            ? `Olá, ${firstName}. Aqui está a visão geral da sua prática clínica.`
            : "Visão geral da sua prática clínica."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="group block">
            <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-card">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-3xl font-extrabold text-foreground">{card.value}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <card.icon className="size-6" />
                </span>
              </CardContent>
              <div className="flex items-center gap-1 border-t border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-primary">
                Ver detalhes
                <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
