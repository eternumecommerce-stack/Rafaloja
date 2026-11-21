import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Checagem otimista (só a presença do cookie). As páginas validam a sessão de verdade no servidor.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Painel: login próprio do dono da loja
  if (pathname.startsWith("/admin")) {
    if (!request.cookies.get("gd_admin")) return NextResponse.redirect(new URL("/login/admin", request.url));
    return NextResponse.next();
  }

  // Conta do cliente
  if (!getSessionCookie(request)) {
    const url = new URL("/account/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account", "/admin/:path*"],
};
