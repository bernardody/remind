import type { Metadata } from "next";

import { ConsumeInviteView } from "@/features/invites/components/consume-invite-view";

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false },
  // Sobrescreve o Open Graph institucional/clínico herdado do layout raiz — o
  // preview desse link circula no WhatsApp antes do clique, muitas vezes para
  // um adolescente, e não deve expor o nome/descrição clínica do produto.
  openGraph: {
    title: "ReMind",
    description: "Você recebeu um link de acesso.",
    siteName: "ReMind",
  },
  twitter: {
    card: "summary",
    title: "ReMind",
    description: "Você recebeu um link de acesso.",
  },
};

interface ConvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params;
  return <ConsumeInviteView token={token} />;
}
