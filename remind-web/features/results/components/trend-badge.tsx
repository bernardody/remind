import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EvolutionTrend } from "@/features/results/schemas";

/**
 * MELHORA usa seta pra baixo de propósito: nesta escala, média menor = menos risco. Nunca só
 * cor (regra já estabelecida em `RISK_BANDS`/`gauge.tsx`) — ícone + texto sempre juntos.
 */
const TREND_CONFIG: Record<
  EvolutionTrend,
  { label: string; icon: LucideIcon; variant: "default" | "secondary" | "destructive" }
> = {
  MELHORA: { label: "Melhora", icon: TrendingDown, variant: "default" },
  PIORA: { label: "Piora", icon: TrendingUp, variant: "destructive" },
  ESTAVEL: { label: "Estável", icon: Minus, variant: "secondary" },
};

export function TrendBadge({ trend }: { trend: EvolutionTrend | null }) {
  if (!trend) return null;
  const config = TREND_CONFIG[trend];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </Badge>
  );
}
