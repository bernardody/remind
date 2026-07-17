"use client";

import { useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { DomainBars } from "@/components/charts/domain-bars";
import { Gauge } from "@/components/charts/gauge";
import { TrendLine } from "@/components/charts/trend-line";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatientQuestionnaires, usePatients } from "@/features/patients/api";
import { usePatientEvolution } from "@/features/results/api";
import { ScaleComparisonBars } from "@/features/results/components/scale-comparison-bars";
import { TrendBadge } from "@/features/results/components/trend-badge";
import type { ApplicationResult, PatientEvolution } from "@/features/results/schemas";
import { formatDateTime } from "@/lib/utils";

const PICKER_PAGE_SIZE = 100;

interface ReportsViewProps {
  /** Pré-seleção vinda de `?paciente=&questionario=` (link "Ver evolução" do resultado individual). */
  initialPatientId?: number;
  initialQuestionnaireId?: number;
}

/**
 * Tela de relatórios (Fase 5b, docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §5.2) —
 * evolução longitudinal de um paciente num questionário: linha do tempo, gráfico de evolução
 * por escala, snapshot mais recente e comparação primeira x última aplicação.
 *
 * Seleção de paciente/questionário é "rascunho" (`pending*`), separada do que de fato dispara a
 * busca (`applied*`) — só troca ao clicar "Carregar relatório". Trocar de paciente com um
 * relatório já carregado na tela não disparava a busca nova de forma confiável (relatado pelo
 * usuário); esse botão explícito remove a ambiguidade de "quando buscar" e também serve como
 * atualização forçada quando a seleção não mudou.
 */
export function ReportsView({ initialPatientId, initialQuestionnaireId }: ReportsViewProps = {}) {
  const [pendingPatientId, setPendingPatientId] = useState<number | null>(initialPatientId ?? null);
  const [pendingQuestionnaireId, setPendingQuestionnaireId] = useState<number | null>(
    initialQuestionnaireId ?? null,
  );
  const [appliedPatientId, setAppliedPatientId] = useState<number | null>(initialPatientId ?? null);
  const [appliedQuestionnaireId, setAppliedQuestionnaireId] = useState<number | null>(
    initialQuestionnaireId ?? null,
  );

  const { data: patients, isLoading: loadingPatients } = usePatients({
    page: 0,
    size: PICKER_PAGE_SIZE,
  });
  const { data: patientQuestionnaires, isLoading: loadingQuestionnaires } = usePatientQuestionnaires(
    pendingPatientId ?? 0,
    { page: 0, size: PICKER_PAGE_SIZE },
    { enabled: Boolean(pendingPatientId) },
  );

  // Um paciente pode ter várias respostas pro mesmo questionário (reaplicação) — o picker
  // mostra cada questionário uma vez só, não uma linha por rodada.
  const questionnaireOptions = useMemo(() => {
    if (!patientQuestionnaires) return [];
    const seen = new Map<number, string>();
    for (const item of patientQuestionnaires.content) {
      if (!seen.has(item.questionnaireId)) seen.set(item.questionnaireId, item.questionnaireTitle);
    }
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [patientQuestionnaires]);

  const patientHasNoQuestionnaires =
    Boolean(pendingPatientId) && !loadingQuestionnaires && questionnaireOptions.length === 0;

  const {
    data: evolution,
    isLoading: loadingEvolution,
    isError: evolutionError,
    refetch,
  } = usePatientEvolution(appliedQuestionnaireId ?? 0, appliedPatientId ?? 0);

  function handleSelectPatient(value: string) {
    setPendingPatientId(Number(value));
    setPendingQuestionnaireId(null);
  }

  function handleLoadReport() {
    if (!pendingPatientId || !pendingQuestionnaireId) return;

    if (pendingPatientId === appliedPatientId && pendingQuestionnaireId === appliedQuestionnaireId) {
      // Seleção não mudou — botão vira "forçar atualização" (reconsulta o backend).
      void refetch();
      return;
    }

    setAppliedPatientId(pendingPatientId);
    setAppliedQuestionnaireId(pendingQuestionnaireId);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Paciente</span>
            <Select
              value={pendingPatientId ? String(pendingPatientId) : undefined}
              onValueChange={handleSelectPatient}
              disabled={loadingPatients}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients?.content.map((patient) => (
                  <SelectItem key={patient.id} value={String(patient.id)}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Questionário</span>
            <Select
              value={pendingQuestionnaireId ? String(pendingQuestionnaireId) : undefined}
              onValueChange={(value) => setPendingQuestionnaireId(Number(value))}
              disabled={!pendingPatientId || loadingQuestionnaires || patientHasNoQuestionnaires}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !pendingPatientId
                      ? "Escolha um paciente primeiro"
                      : patientHasNoQuestionnaires
                        ? "Nenhum questionário respondido"
                        : "Selecione um questionário"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {questionnaireOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleLoadReport}
            disabled={!pendingPatientId || !pendingQuestionnaireId || loadingEvolution}
          >
            <RefreshCw className="size-4" />
            Carregar relatório
          </Button>
        </CardContent>
      </Card>

      {patientHasNoQuestionnaires ? (
        <EmptyState
          icon={BarChart3}
          title="Esse paciente ainda não respondeu a nenhum questionário"
          description="Assim que ele responder pelo menos uma avaliação, o relatório fica disponível aqui."
        />
      ) : !appliedPatientId || !appliedQuestionnaireId ? (
        <EmptyState
          icon={BarChart3}
          title="Selecione um paciente e um questionário"
          description="Depois clique em “Carregar relatório” pra ver a evolução."
        />
      ) : evolutionError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : loadingEvolution ? (
        <LoadingState rows={4} />
      ) : !evolution || evolution.applications.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Esse paciente ainda não respondeu ao questionário"
          description="Assim que houver uma resposta, a evolução aparece aqui."
        />
      ) : (
        <ReportContent evolution={evolution} />
      )}
    </div>
  );
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function ReportContent({ evolution }: { evolution: PatientEvolution }) {
  const applications = evolution.applications;
  const first = applications[0];
  const latest = applications[applications.length - 1];
  const hasHistory = applications.length > 1;

  const scaleNames = Array.from(
    new Set(applications.flatMap((app) => app.scaleResults.map((s) => s.scaleName))),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap gap-3">
            {applications.map((app: ApplicationResult, index) => (
              <li
                key={app.questionnaireAnswerId}
                className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-xs text-muted-foreground">Aplicação {index + 1}</span>
                <span className="text-sm font-medium text-foreground">
                  {formatDateTime(app.answeredAt)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Média {app.average.toFixed(1)}
                </span>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {daysBetween(applications[index - 1].answeredAt, app.answeredAt)} dias desde a
                    anterior
                  </span>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <span className="text-sm font-medium text-muted-foreground">
            Aplicação mais recente — {formatDateTime(latest.answeredAt)}
          </span>
          <Gauge value={latest.average} />
        </CardContent>
      </Card>

      {latest.scaleResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escore por escala — mais recente</CardTitle>
          </CardHeader>
          <CardContent>
            <DomainBars data={latest.scaleResults} />
          </CardContent>
        </Card>
      )}

      {hasHistory && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução por escala</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {scaleNames.map((scaleName) => (
                <TrendLine
                  key={scaleName}
                  scaleName={scaleName}
                  data={applications.map((app) => ({
                    answeredAt: app.answeredAt,
                    average: app.scaleResults.find((s) => s.scaleName === scaleName)?.average ?? 0,
                  }))}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primeira aplicação x mais recente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ScaleComparisonBars first={first} last={latest} />
              <div className="flex flex-wrap gap-3">
                {latest.scaleResults.map((scale) => (
                  <div key={scale.scaleId} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{scale.scaleName}</span>
                    <TrendBadge trend={scale.trend} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
