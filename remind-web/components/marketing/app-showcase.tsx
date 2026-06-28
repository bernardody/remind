import { LayoutDashboard, ListChecks, FileBarChart } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

/** RF-08 — Demonstração visual: mockups do app (CSS, substituíveis por screenshots). */
export function AppShowcase() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="A plataforma"
          title="Veja como o ReMind funciona"
          description="Uma interface clínica, calma e organizada — pensada para a densidade de dados do dia a dia do psicólogo."
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <span className="size-3 rounded-full bg-destructive/50" />
              <span className="size-3 rounded-full bg-secondary" />
              <span className="size-3 rounded-full bg-primary/50" />
              <span className="ml-3 hidden text-xs text-muted-foreground sm:inline">
                app.remindapp.com.br
              </span>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-[200px_1fr]">
              {/* sidebar */}
              <aside className="hidden flex-col gap-1 bg-card p-4 sm:flex">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: ListChecks, label: "Pacientes" },
                  { icon: FileBarChart, label: "Avaliações" },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      item.active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </span>
                ))}
              </aside>

              {/* main */}
              <div className="bg-card p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { k: "Pacientes ativos", v: "48" },
                    { k: "Avaliações no mês", v: "126" },
                    { k: "Risco alto", v: "7" },
                  ].map((stat) => (
                    <div
                      key={stat.k}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <p className="text-xs text-muted-foreground">{stat.k}</p>
                      <p className="mt-1 text-2xl font-extrabold">{stat.v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold">Avaliações recentes</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { name: "Rodrigo M. Prado", scale: "CARS", risk: "Moderado" },
                      { name: "Ana C. Ribeiro", scale: "UCLA", risk: "Baixo" },
                      { name: "Lucas Fernandes", scale: "SPI", risk: "Alto" },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{row.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.scale}
                        </span>
                        <span className="rounded-full bg-secondary/40 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {row.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
