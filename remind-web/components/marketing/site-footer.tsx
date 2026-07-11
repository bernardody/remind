import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { SITE, ROUTES } from "@/lib/constants";

/** RF-10 — Footer: logo + Contato + Legal + copyright. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-graphite text-snow">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo textClassName="text-snow" />
          <p className="max-w-xs text-sm leading-relaxed text-snow/70">
            A primeira plataforma de avaliação de dependência digital para a
            prática clínica.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-snow/60">
            Contato
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 text-snow/80 transition-colors hover:text-snow"
              >
                <Mail className="size-4" />
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={SITE.phoneHref}
                className="inline-flex items-center gap-2 text-snow/80 transition-colors hover:text-snow"
              >
                <Phone className="size-4" />
                {SITE.phone}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-snow/60">
            Legal
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                href={ROUTES.privacidade}
                className="text-snow/80 transition-colors hover:text-snow"
              >
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.termos}
                className="text-snow/80 transition-colors hover:text-snow"
              >
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.contato}
                className="text-snow/80 transition-colors hover:text-snow"
              >
                Contato
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-snow/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-snow/60 sm:px-6 lg:px-8">
          © {year} {SITE.name}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
