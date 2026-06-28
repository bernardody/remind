import type { ReactNode } from "react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SITE } from "@/lib/constants";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      email: SITE.email,
      url: SITE.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main id="conteudo">{children}</main>
      <SiteFooter />
    </>
  );
}
