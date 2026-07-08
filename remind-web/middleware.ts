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

  if (isAuthed && isLogin) {
    return NextResponse.redirect(
      new URL(HOME_BY_USER_TYPE[session.user.type], nextUrl),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/psicologo/:path*", "/paciente/:path*", "/login"],
};
