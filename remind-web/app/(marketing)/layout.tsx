import type { ReactNode } from "react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SITE } from "@/lib/constants";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  // @graph agrupa as 3 entidades num único bloco, ligadas por @id — é o
  // formato recomendado pelo Google quando várias entidades descrevem o
  // mesmo site (evita JSON-LD duplicado/conflitante por página).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        email: SITE.email,
        logo: `${SITE.url}/icon.png`,
        description: SITE.description,
        contactPoint: {
          "@type": "ContactPoint",
          email: SITE.email,
          telephone: SITE.phone,
          contactType: "customer support",
          areaServed: "BR",
          availableLanguage: "Portuguese",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: SITE.locale,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE.url}/#software`,
        name: SITE.name,
        applicationCategory: "HealthApplication",
        applicationSubCategory: "Software para psicólogos",
        operatingSystem: "Web",
        description: SITE.description,
        url: SITE.url,
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    ],
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
