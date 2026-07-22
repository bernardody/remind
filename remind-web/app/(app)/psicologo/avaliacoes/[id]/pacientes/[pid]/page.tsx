import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, BarChart3, TrendingUp } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DomainBars } from "@/components/charts/domain-bars";
import { Gauge } from "@/components/charts/gauge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QuestionnaireDetail } from "@/features/questionnaires/schemas";
import { ScoreDisclaimer } from "@/features/results/components/score-disclaimer";
import type {
  PatientAnswerDetail,
  PatientAnswers,
  PatientEvolution,
  PatientResult,
} from "@/features/results/schemas";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface ResultadoPageProps {
  params: Promise<{ id: string; pid: string }>;
}

export default async function ResultadoPage({ params }: ResultadoPageProps) {
  const session = await requireRole("PSYCHOLOGIST");
  const { id, pid } = await params;
  const questionnaireId = Number(id);
  const patientId = Number(pid);

  let answers: PatientAnswers;
  let result: PatientResult;
  let questionnaire: QuestionnaireDetail;
  let evolution: PatientEvolution | null;
  try {
    [answers, result, questionnaire, evolution] = await Promise.all([
      apiFetch<PatientAnswers>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/respostas`,
        { token: session.accessToken },
      ),
      apiFetch<PatientResult>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/resultado`,
        { token: session.accessToken },
      ),
      apiFetch<QuestionnaireDetail>(`/questionarios/${questionnaireId}`, {
        token: session.accessToken,
      }),
      // Só usado pra decidir se mostra o link "Ver evolução" (docs/specs/
      // 003-relatorios-evolucao-longitudinal/PRD.md §5.3) — nunca deve derrubar a página.
      apiFetch<PatientEvolution>(
        `/questionarios/${questionnaireId}/pacientes/${patientId}/evolucao`,
        { token: session.accessToken },
      ).catch(() => null),
    ]);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const hasHistory = (evolution?.applications.length ?? 0) > 1;

  // Agrupa respostas por escala pra leitura clínica — `respostas` não traz a
  // escala de cada pergunta, só o detalhe do questionário tem esse mapeamento
  // (`questions[].scale`), por isso o fetch extra acima (PRD.md §5.9).
  const questionScale = new Map(
    questionnaire.questions.map((q) => [q.id, q.scale.name] as const),
  );
  const responsesByScale = new Map<string, { response: PatientAnswerDetail; index: number }[]>();
  answers.responses.forEach((response, index) => {
    const scaleName = questionScale.get(response.questionId) ?? "Outras";
    const group = responsesByScale.get(scaleName) ?? [];
    group.push({ response, index });
    responsesByScale.set(scaleName, group);
  });
  const scaleGroups = Array.from(responsesByScale.entries());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={answers.patientName}
        description={`${answers.questionnaireTitle} · respondido em ${formatDateTime(answers.answeredAt)}`}
        actions={
          hasHistory && (
            <Button variant="outline" asChild>
              <Link
                href={`${ROUTES.psicologo.relatorios}?paciente=${patientId}&questionario=${questionnaireId}`}
              >
                <TrendingUp className="size-4" />
                Ver evolução
              </Link>
            </Button>
          )
        }
      />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="respostas">Respostas detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="flex flex-col gap-6">
          <ScoreDisclaimer />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-primary" />
                Escore médio
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-2 pb-8">
              <Gauge value={result.average} />
            </CardContent>
          </Card>

          {result.scaleResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-primary" />
                  Escore por escala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DomainBars data={result.scaleResults} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="respostas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas por escala</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <Accordion
                type="multiple"
                defaultValue={scaleGroups.map(([scaleName]) => scaleName)}
                className="px-6"
              >
                {scaleGroups.map(([scaleName, items]) => (
                  <AccordionItem key={scaleName} value={scaleName}>
                    <AccordionTrigger>
                      <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                        <span>{scaleName}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {items.length} {items.length === 1 ? "resposta" : "respostas"}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col divide-y divide-border">
                        {items.map(({ response, index }) => (
                          <div
                            key={response.questionId}
                            className="flex flex-col gap-1.5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                          >
                            <span className="flex items-start gap-3 text-sm text-foreground">
                              <span className="mt-0.5 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              {response.questionText}
                            </span>
                            <span className="ml-7 shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground sm:ml-0">
                              {response.chosenOption} · {response.chosenValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
