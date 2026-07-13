import type { Metadata } from "next";

import { ConsumeInviteView } from "@/features/invites/components/consume-invite-view";

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false },
};

interface ConvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params;
  return <ConsumeInviteView token={token} />;
}
