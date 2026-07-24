import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} · ${SITE.tagline}`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F4",
    theme_color: "#1A7A6E",
    lang: "pt-BR",
    icons: [
      {
        src: "/brand/symbol-color.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
