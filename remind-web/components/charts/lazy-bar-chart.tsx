"use client";

import dynamic from "next/dynamic";
import type { BarDatum } from "./bar-chart";

const BarChartImpl = dynamic(
  () => import("./bar-chart").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-xl bg-muted"
        style={{ height: 220 }}
        aria-hidden
      />
    ),
  },
);

/** Carrega o Recharts sob demanda — mantém o bundle inicial da landing leve. */
export function LazyBarChart(props: {
  data: BarDatum[];
  max?: number;
  height?: number;
  className?: string;
}) {
  return <BarChartImpl {...props} />;
}
