import Link from "next/link";
import { ChevronRight, ClipboardList, Users, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { Patient } from "@/features/patients/schemas";
import type { Questionnaire, QuestionnairePatient } from "@/features/questionnaires/schemas";
import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface OverviewCard {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
}

interface RecentAnswer {
  questionnaireId: number;
  questionnaireTitle: string;
  patientId: number;
  patientName: string;
  answeredAt: string;
}

// Sem endpoint de "avaliações recentes" no backend — o catálogo de
// questionários é pequeno hoje, então agrega no frontend a partir de uma
// amostra em vez de esperar a Fase 5 (PRD.md §5.4).
const RECENT_QUESTIONNAIRES_SAMPLE = 5;
const RECENT_ANSWERS_PER_QUESTIONNAIRE = 5;
const RECENT_ANSWERS_SHOWN = 5;

export default async function PsicologoDashboardPage() {
  const session = await requireRole("PSYCHOLOGIST");
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  const [patients, questionnaires] = await Promise.all([
    apiFetch<Page<Patient>>("/pacientes", {
      params: { size: 1 },
      token: session.accessToken,
    }),
    apiFetchPage<Questionnaire>(
      "/questionarios",
      { size: RECENT_QUESTIONNAIRES_SAMPLE },
      { token: session.accessToken },
    ),
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

  const recentByQuestionnaire = await Promise.all(
    questionnaires.content.map((questionnaire) =>
      apiFetchPage<QuestionnairePatient>(
        `/questionarios/${questionnaire.id}/pacientes`,
        { size: RECENT_ANSWERS_PER_QUESTIONNAIRE },
        { token: session.accessToken },
      ).then((page) =>
        page.content.map(
          (patient): RecentAnswer => ({
            questionnaireId: questionnaire.id,
            questionnaireTitle: questionnaire.title,
            patientId: patient.patientId,
            patientName: patient.patientName,
            answeredAt: patient.answeredAt,
          }),
        ),
      ),
    ),
  );

  const recentAnswers = recentByQuestionnaire
    .flat()
    .sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1))
    .slice(0, RECENT_ANSWERS_SHOWN);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={
          firstName
            ? `Olá, ${firstName}. Aqui está a visão geral da sua prática clínica.`
            : "Visão geral da sua prática clínica."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avaliações recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentAnswers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="Nenhuma avaliação respondida ainda"
                description="Assim que um paciente responder uma avaliação, ela aparece aqui."
              />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentAnswers.map((answer) => (
                <Link
                  key={`${answer.questionnaireId}-${answer.patientId}`}
                  href={`${ROUTES.psicologo.avaliacoes}/${answer.questionnaireId}/pacientes/${answer.patientId}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{answer.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {answer.questionnaireTitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(answer.answeredAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
