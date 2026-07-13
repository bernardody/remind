import { Badge } from "@/components/ui/badge";
import type { InviteStatus } from "@/features/invites/schemas";

/**
 * Vocabulário de estado do convite (docs/specs/002-convite-questionario §7).
 * Sem variante nova no design system — reaproveita as já existentes do `Badge`.
 */
const STATUS_CONFIG: Record<InviteStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Preparando", variant: "secondary" },
  SENT: { label: "Enviado", variant: "secondary" },
  OPENED: { label: "Aberto", variant: "outline" },
  ANSWERED: { label: "Respondido", variant: "default" },
  EXPIRED: { label: "Expirado", variant: "outline" },
  REVOKED: { label: "Revogado", variant: "destructive" },
};

export function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
