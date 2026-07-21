import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { HOME_BY_USER_TYPE, ROUTES } from "@/lib/constants";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthed = !!session && Date.now() < session.expiresAt;

  const isPsicologo = nextUrl.pathname.startsWith("/psicologo");
  const isPaciente = nextUrl.pathname.startsWith("/paciente");
  const isProtected = isPsicologo || isPaciente;
  const isLogin = nextUrl.pathname === ROUTES.login;

  if (isProtected && !isAuthed) {
    const url = new URL(ROUTES.login, nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthed && isProtected) {
    const wrongProfile =
      (isPsicologo && session.user.type !== "PSYCHOLOGIST") ||
      (isPaciente && session.user.type !== "PATIENT");
    if (wrongProfile) {
      return NextResponse.redirect(
        new URL(HOME_BY_USER_TYPE[session.user.type], nextUrl),
      );
    }
  }

  // Conta de psicólogo criada via Google fica com `profileComplete=false`
  // até preencher CPF/telefone/endereço (spec 001-login-google-psicologo).
  // O backend bloqueia (403) qualquer rota além de completar/ler o próprio
  // perfil — sem esse redirect aqui, o dashboard quebrava com um erro
  // genérico ao chamar `/pacientes` (ver docs internos do gap).
  if (isAuthed && isPsicologo && session.user.type === "PSYCHOLOGIST") {
    const isCompletarPerfil = nextUrl.pathname === ROUTES.psicologo.completarPerfil;
    if (!session.user.profileComplete && !isCompletarPerfil) {
      return NextResponse.redirect(
        new URL(ROUTES.psicologo.completarPerfil, nextUrl),
      );
    }
    if (session.user.profileComplete && isCompletarPerfil) {
      return NextResponse.redirect(new URL(ROUTES.psicologo.dashboard, nextUrl));
    }
  }

  // Sessão nascida de um convite (escopo restrito a 1 questionário, PRD
  // docs/specs/002-convite-questionario §16/§20) — o backend bloqueia (403)
  // qualquer rota fora do questionário do convite, incluindo `/questionarios/
  // convites` (usada por `/paciente/inicio` e `/paciente/perfil`). Sem esse
  // redirect, qualquer navegação de volta a essas rotas (inclusive o destino
  // padrão pós-`/login`) cai num 403 em loop — mesma causa raiz corrigida em
  // `confirmation.tsx`/`responder/page.tsx`.
  if (isAuthed && isPaciente && session.user.questionnaireId) {
    const restrictedHome = ROUTES.paciente.responder(session.user.questionnaireId);
    const isRestrictedHome = nextUrl.pathname === restrictedHome;
    if (!isRestrictedHome) {
      return NextResponse.redirect(new URL(restrictedHome, nextUrl));
    }
  }

  if (isAuthed && isLogin) {
    const home =
      session.user.type === "PATIENT" && session.user.questionnaireId
        ? ROUTES.paciente.responder(session.user.questionnaireId)
        : HOME_BY_USER_TYPE[session.user.type];
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/psicologo/:path*", "/paciente/:path*", "/login"],
};
